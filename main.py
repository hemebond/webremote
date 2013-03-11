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

import socket
import argparse
import re, dbus, json, sys, mimeparse, mpris2
import cgi
from urlparse import urlparse, parse_qsl
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
from SimpleHTTPServer import SimpleHTTPRequestHandler


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


# This class will handles any incoming request from the browser
class RequestHandler(SimpleHTTPRequestHandler):
	# Handler for the GET requests
	def do_GET(self):
		requested_mimetype = mimeparse.best_match(
			["text/html", "application/json"],
			self.headers.get("accept")
		)
		output = None

		if self.path == "/":
			if requested_mimetype == "application/json":
				# return the dict of applications as a JSON array
				# {"my_application": "My Application"}
				output = json.dumps(get_application_list())
			else:
				return SimpleHTTPRequestHandler.do_GET(self)
		elif re.match('/static/', self.path):
			return SimpleHTTPRequestHandler.do_GET(self)
		elif re.match('/(?P<application>[^/]+)/player/', self.path):
			if requested_mimetype == "application/json":
				# return status as JSON string
				match = re.match('/(?P<application>[^/]+)/player/', self.path)
				application_name = match.groupdict()['application']

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
						import base64, urllib2, Image, StringIO
						image_file = urllib2.urlopen(str(output['Metadata']['mpris:artUrl']))
						image_string = StringIO.StringIO(image_file.read())
						image_object = Image.open(image_string)
						image_object.thumbnail((256, 256), Image.BILINEAR)
						image_buffer = StringIO.StringIO()
						image_object.save(image_buffer, format="JPEG")
						b64_data = base64.b64encode(image_buffer.getvalue())
						output['Metadata']['mpris:artUrl'] = "data:image/jpeg;base64,%s" % b64_data
						image_file.close()

				if output['Metadata'] == {}:
					output.removeAttr('Metadata')

				output = json.dumps(output)
		elif re.match('/(?P<application>[^/]+)/', self.path):
			print "application"
			if requested_mimetype == "application/json":
				matches = re.match('/(?P<application>[^/]+)/', self.path)
				application_name = matches.groupdict()['application']

				application = self.get_application(application_name)

				if application is not None:
					application_properties = [
						"Identity",
						"CanQuit",
						"CanRaise",
						"CanSetFullscreen",
					]

					output = {}
					for p in application_properties:
						output[p] = getattr(application, p)
					output = json.dumps(output)

		if output is not None:
			self.send_response(200)
			self.send_header('Content-Type', requested_mimetype)
			self.end_headers()

			# Send the html message
			self.wfile.write(output.encode("UTF-8"))
			self.wfile.write("\n")
			return

	def do_POST(self):
		url = urlparse(self.path)
		query = parse_qsl(url.query)

		# Parse the POST data into a dict
		print "self.headers.getheader('content-type')"
		print self.headers.getheader('content-type')
		content_type_headers = self.headers.getheader('content-type')

		if content_type_headers is not None:
			content_type, pdict = cgi.parse_header(self.headers.getheader('content-type'))
			length = int(self.headers.getheader('content-length'))

			if content_type == 'multipart/form-data':
				post_data = cgi.parse_multipart(self.rfile, pdict)
			elif content_type == 'application/x-www-form-urlencoded':
				qs = self.rfile.read(length)
				post_data = cgi.parse_qs(qs, keep_blank_values=1)
			else:
				post_data = {} # Unknown content-type
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
				else:
					print "No attribute %s" % key

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


def main():
	parser = argparse.ArgumentParser(description="Provide a web interface to MPRIS2 media players.")
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
		print('Listening on %s:%s' % (args.http_host, args.http_port))
		#Wait forever for incoming htto requests
		server.serve_forever()
	except KeyboardInterrupt:
		print('Shutting down')
		server.socket.close()


if __name__ == '__main__':
	main()
