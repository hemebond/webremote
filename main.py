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
import web, re, dbus, json, sys, mimeparse, mpris2
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
	applications = {}

	for path in bus_names:
		match = mpris2_bus_regex.match(path)

		if match:
			application = mpris2.Application(path)
			name = match.group(1)

			if name not in applications:
				applications[name] = {
					'identity': application.Identity,
					'bus': path,
				}

	return applications


def get_player_root(handler, requested_mimetype):
	pass


def matches(regex, string, store_var=None):
	m = re.match(regex, string)
	if m:
		if store_var is not None:
			store_var = m
		return True
	return False


# This class will handles any incoming request from the browser
class RequestHandler(SimpleHTTPRequestHandler):
	# Handler for the GET requests
	def do_GET(self):
		requested_mimetype = mimeparse.best_match(
			["text/html", "application/json"],
			self.headers.get("accept")
		)

		if requested_mimetype == "application/json":
			output = ""

			if self.path == "/":
				# return the dict of applications as a JSON array
				# {"my_application": "My Application"}
				output = json.dumps(get_application_list())
			elif re.match('/(?P<application>\w+)/player/', self.path):
				# return status as JSON string
				match = re.match('/(?P<application>\w+)/player/', self.path)
				application_name = match.groupdict()['application']
				application_list = get_application_list()
				application_bus  = application_list[application_name]['bus']
				application      = mpris2.Application(application_bus)

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
				output = json.dumps(output)
			elif re.match('/(?P<application>\w+)/', self.path):
				matches = re.match('/(?P<application>\w+)/', self.path)
				application_name = matches.groupdict()['application']
				application_list = get_application_list()

				try:
					application_bus = application_list[application_name]['bus']
				except KeyError:
					self.send_response(404)
					return

				application = mpris2.Application(application_bus)

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

			self.send_response(200)
			self.send_header('Content-type', requested_mimetype)
			self.end_headers()

			# Send the html message
			self.wfile.write(output.encode("UTF-8"))
			self.wfile.write(u"\n")
			return

		return SimpleHTTPRequestHandler.do_GET(self)

	def do_POST(self):
		url = urlparse(self.path)
		query = parse_qsl(url.query)

		# Parse the POST data into a dict
		content_type, pdict = cgi.parse_header(self.headers.getheader('content-type'))
		length = int(self.headers.getheader('content-length'))

		if content_type == 'multipart/form-data':
			post_data = cgi.parse_multipart(self.rfile, pdict)
		elif content_type == 'application/x-www-form-urlencoded':
			qs = self.rfile.read(length)
			post_data = cgi.parse_qs(qs, keep_blank_values=1)
		else:
			post_data = {} # Unknown content-type

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

		try:
			application_bus = application_list[application_name]['bus']
			application = mpris2.Application(application_bus)
		except KeyError, mpris2.PlayerNotRunning:
			self.send_response(
				404, message="No application \"%s\"" % application_name
			)
			return None

		return application


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
