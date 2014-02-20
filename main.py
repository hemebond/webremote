# Copyright 2011 James O'Neill
#
# This file is part of webremote.
#
# webremote is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# webremote is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with webremote.  If not, see <http://www.gnu.org/licenses/>.

import os
import socket
import argparse
import re, dbus, json, mpris2

from http.server import HTTPServer  # BaseHTTPRequestHandler
from http.server import SimpleHTTPRequestHandler

from datetime import datetime

import imghdr


class PlayerNotRunning(Exception):
	pass


def get_application_list():
	mpris2_bus_regex = re.compile('^org\.mpris\.MediaPlayer2\.([^.]+)$')
	bus = dbus.SessionBus()
	bus_names = bus.list_names()
	applications = []

	for path in bus_names:
		match = mpris2_bus_regex.match(path)

		if match:
			application = mpris2.Application(path)
			name = match.group(1)

			applications.append({
				'name': name,
				'url': "/%s/" % name,
				'Identity': application.Identity,
				'bus': path,
				'player': {
					'url': "/%s/player/" % name,
					'PlaybackStatus': application.player.PlaybackStatus,
				}
			})

	return applications


def get_player_root(handler, requested_mimetype):
	pass


def test_url_patterns(url):
	patterns = [
		(r'^/$', 'index'),
		(r'^/static/', 'static'),
		(r'^/art/(?P<application>[\w\d]+)/(?P<image>[\w\d]+)', 'art'),
		(r'^/(?P<application>[\w\d]+)/playlists/', 'playlists'),
		(r'^/(?P<application>[\w\d]+)/player/', 'player'),
		(r'^/(?P<application>[\w\d]+)/(\?.+)?', 'application'),
	]

	for pattern, pattern_name in patterns:
		matches = re.match(pattern, url)

		if matches:
			return (
				pattern_name,
				matches
			)

	return (None, None)


# This class will handles any incoming request from the browser
class RequestHandler(SimpleHTTPRequestHandler):
	# Handler for the GET requests
	def do_GET(self):
		output = None
		requested_mimetype = None

		match_name, matches = test_url_patterns(self.path)

		if match_name is None:
			self.send_error(404, "File not found")

		accept_header = self.headers.get("accept")
		if "application/json" in accept_header:
			requested_mimetype = "application/json"

		#
		# Static files
		#
		if match_name == 'static':
			return super(RequestHandler, self).do_GET()

		elif match_name == 'art':
			application_name = matches.groupdict()['application']
			filename = matches.groupdict()['image']

			home = os.path.expanduser("~")

			art_directories = {
				'rhythmbox': home + "/.cache/rhythmbox/album-art/",
			}

			art_dir = art_directories[application_name]
			file_path = art_dir + filename

			try:
				image_type = imghdr.what(file_path)
				image_stat = os.stat(file_path)
				image_size = image_stat.st_size
				image_mtime = image_stat.st_mtime
				last_modified = datetime.fromtimestamp(image_mtime).strftime("%a, %d %b %Y %H:%M:%S GMT")
			except OSError:
				self.send_error(404, "File not found")

			if self.headers['If-Modified-Since'] and self.headers['If-Modified-Since'] == last_modified:
				modified = False
			else:
				modified = True


			if modified:
				self.send_response(200)
			else:
				self.send_response(304)

			if modified:
				with open(file_path, 'rb') as f:
					image_data = f.read()

				if image_type is None:
					if image_data.startswith(b'\xff\xd8'):
							image_type = "jpeg"
					else:
						self.send_error(500, "Could not determine file type")

				self.send_header("Content-type", "image/" + image_type)

			self.send_header("Content-length", image_size)
			self.send_header("Last-Modified", last_modified)
			self.end_headers()

			if modified:
				self.wfile.write(image_data)
			return

		elif requested_mimetype == "application/json":
			#
			# Root
			#
			if match_name == 'index':
				# return the dict of applications as a JSON array
				# {"my_application": "My Application"}
				output = json.dumps(get_application_list())
			#
			# Playlists
			#
			elif match_name == 'playlists':
				# return status as JSON string
				application_name = matches.groupdict()['application']

				application = self.get_application(application_name)

				if application is None:
					return

				output = json.dumps([])

			#
			# Player
			#
			elif match_name == 'player':
				# return status as JSON string
				application_name = matches.groupdict()['application']

				application = self.get_application(application_name)

				if application is None:
					return

				player_properties = [
					"PlaybackStatus",
					"LoopStatus",
					"Rate",
					"Shuffle",
					"Metadata",
					"Volume",
					"Position",
					"MinimumRate",
					"MaximumRate",
					"CanGoNext",
					"CanGoPrevious",
					"CanPlay",
					"CanPause",
					"CanSeek",
					"CanControl",
				]

				output = {}
				for p in player_properties:
					output[p] = getattr(application.player, p)

				if 'Metadata' in output:
					if 'mpris:artUrl' in output['Metadata']:
						# import base64
						# import imghdr
						# from urllib.request import urlopen

						# url = output['Metadata']['mpris:artUrl']

						# # Read the image byte stream
						# image = urlopen(url).read()

						# # Base64 encode the byte stream and then convert to a UTF-8 string
						# image_64 = base64.b64encode(image).decode("UTF-8")

						# # Detect the type of image
						# image_type = imghdr.what("", h=image)

						# output['Metadata']['art'] = "data:image/%s;base64,%s" % (image_type, image_64)
						name = output['Metadata']['mpris:artUrl'].split("/")[-1]
						output['Metadata']['mpris:artUrl'] = "/art/%s/%s" % (application_name, name)


				if output['Metadata'] == {}:
					del output['Metadata']

				output['url'] = "/%s/player/" % application_name

				# make output a diff of the currently cached response
				if self.client_address[0] in response_cache:
					diff = {}

					cache = response_cache[self.client_address[0]]

					for key in output:
						if key in cache:
							if output[key] != cache[key]:
								cache[key] = output[key]
								diff[key] = output[key]
						else:
							diff[key] = output[key]
					output = diff
				else:
					response_cache[self.client_address[0]] = output

				output = json.dumps(output)

			#
			# Application
			#
			elif match_name == 'application':
				application_name = matches.groupdict()['application']

				application = self.get_application(application_name)

				if application is not None:
					application_properties = [
						"CanQuit",
						"Fullscreen",
						"CanSetFullscreen",
						"CanRaise",
						"HasTrackList",
						"Identity",
						"DesktopEntry",
						"SupportedUriSchemes",
						"SupportedMimeTypes"
					]

					output = {}
					for p in application_properties:
						try:
							output[p] = getattr(application, p)
						except dbus.exceptions.DBusException:
							pass

					output['bus'] = application.path

					output = json.dumps(output)
		#
		# Index
		#
		else:
			requested_mimetype = "text/html"
			#return SimpleHTTPRequestHandler.do_GET(self)
			with open("index.html") as f:
				output = f.read()

			initial_app_list = json.dumps(get_application_list())
			output = output.replace("initialAppList=[]", "initialAppList=%s" % initial_app_list)

			# reset the response cache for this user
			if self.client_address[0] in response_cache:
				response_cache[self.client_address[0]] = {}

		if output is not None:
			self.send_response(200)
			self.send_header('Content-Type', requested_mimetype)
			self.send_header('Cache-Control', "no-store")
			self.end_headers()

			# Send the html message
			self.wfile.write(output.encode("UTF-8"))
			self.wfile.write(bytes("\n", 'UTF-8'))

		return

	def do_POST(self):
		# Parse the POST data into a dict
		content_type = self.headers.get_content_type()
		content_length = int(self.headers['Content-length'])

		if content_type == 'application/json':
			qs = self.rfile.read(content_length).decode('UTF-8')
			post_data = json.loads(qs)
		else:
			post_data = {}

		# Call a method on the player
		m = re.match('/(?P<application>\w+)/player/(?P<action>\w+)$', self.path)
		if m:
			groups = m.groupdict()
			application_name = groups['application']
			application = self.get_application(application_name)

			if application is None:
				return

			action = groups['action']

			try:
				getattr(application.player, action)(**post_data)
			except AttributeError:
				self.send_response(
					404, message="No method \"%s\"" % action
				)
				return

			self.send_response(200)
			return

		# Set properties on the player
		m = re.match('/(?P<application>\w+)/player/$', self.path)
		if m:
			# posting new properties to the player
			application_name = m.groupdict()['application']
			application = self.get_application(application_name)

			if application is None:
				return

			for key, val in post_data.items():
				if hasattr(application.player, key):
					if isinstance(val, list):
						val = val[0]

					setattr(application.player, key, val)

			self.send_response(200)
			return

		# Call a method on the application
		m = re.match('/(?P<application>\w+)/(?P<action>\w+)$', self.path)
		if m:
			groups = m.groupdict()
			application_name = groups['application']
			application = self.get_application(application_name)

			if application is None:
				return

			action = groups['action']

			response_code, response_message = self.call_method(application, action, post_data)

			self.send_response(response_code, message=response_message)
			return

		# Set properties on the application
		m = re.match('/(?P<application>\w+)/$', self.path)
		if m:
			# posting new properties to the application
			application_name = m.groupdict()['application']
			application = self.get_application(application_name)

			if application is None:
				return

			for key, val in post_data.items():
				if hasattr(application, key):
					if isinstance(val, list):
						val = val[0]

					setattr(application, key, val)

			self.send_response(200)
			return

		self.send_response(405) # Method Not Allowed
		return

	def get_application(self, application_name):
		application_list = get_application_list()

		for app in application_list:
			if app['name'] == application_name:
				return mpris2.Application(app['bus'])

		self.send_response(
			404, message="No application \"%s\"" % application_name
		)
		return None

	def call_method(self, mpris_object, method, parameters={}):
		"""
		Calls a method on the mpris object, passing in the parameters.

		Returns the HTTP response.
		"""

		try:
			getattr(mpris_object, method)(**parameters)
		except AttributeError:
			return 404, "No method \"%s\"" % method
		except TypeError:
			return 424, "Bad parameters"

		return 200, None


class HTTPServerV6(HTTPServer):
	address_family = socket.AF_INET6


# A dict to store the last set of data sent to the client
response_cache = {}


def main():
	parser = argparse.ArgumentParser(
		description="Provide a web interface to MPRIS2 media players."
	)
	parser.add_argument(
		"-i", "--http-host",
		default="0.0.0.0",
	)
	parser.add_argument(
		"-p", "--http-port",
		default=8080,
		type=int,
	)
	args = parser.parse_args()

	if "::" in args.http_host:
		server_class = HTTPServerV6
	else:
		server_class = HTTPServer

	try:
		#Create a web server and define the handler to manage the
		#incoming request
		server = server_class((args.http_host, args.http_port), RequestHandler)
		print("Listening on %s:%s" % (args.http_host, args.http_port))
		#Wait forever for incoming htto requests
		server.serve_forever()
	except KeyboardInterrupt:
		print("Shutting down")
		server.socket.close()


if __name__ == '__main__':
	main()
