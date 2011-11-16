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

import web, re, dbus, json, sys, mimeparse, mpris, mpris2

apis = [
	("mpris2", re.compile('^org\.mpris\.MediaPlayer2\.([^.]+)$')),
	("mpris", re.compile('^org\.mpris\.([^.]+)$'))
]

class PlayerNotRunning(Exception):
	pass

def remote_factory(player_name):
	bus = dbus.SessionBus()
	bus_names = bus.list_names()

	for path in bus_names:
		if player_name in path:
			for api, regex in apis:
				if regex.match(path):
					if api == "mpris2":
						return mpris2.Remote(path)
					elif api == "mpris":
						return mpris.Remote(path)
	raise PlayerNotRunning()


def get_player_list():
	bus = dbus.SessionBus()
	bus_names = bus.list_names()
	players = {}

	for api, regex in apis:
		for path in bus_names:
			if regex.match(path):
				player = remote_factory(path)

				name = regex.match(path).group(1)

				if name not in players:
					players[name] = player.Identity

	return players

class Index:
	def GET(self):
		player_list = get_player_list()

		requested_mimetype = mimeparse.best_match(["text/html", "application/json"], web.ctx.environ['HTTP_ACCEPT'])
		if requested_mimetype == "text/html":
			web.header("Content-Type", "text/html")
			web.header("Cache-Control", "no-store, no-cache, must-revalidate")
			return render.index(player_list)
		elif requested_mimetype == "application/json":
			web.header('Content-Type', "application/json")
			return json.dumps(player_list)
		else:
			raise web.notfound()

class Remote:
	def GET(self, player_name):
		try:
			remote = remote_factory(player_name)
		except PlayerNotRunning:
			raise web.notfound()

		requested_mimetype = mimeparse.best_match(["text/html", "application/json"], web.ctx.environ['HTTP_ACCEPT'])

		if requested_mimetype == "application/json":
			remote_properties = {
				"Identity": remote.Identity,
				"CanQuit": remote.CanQuit,
				"CanRaise": remote.CanRaise
			}
			return json.dumps(remote_properties)
		else:
			return render.player(remote.Identity)

class Player:
	def GET(self, player_name, property_name=None):
		try:
			remote = remote_factory(player_name)
		except PlayerNotRunning:
			raise web.notfound()

		requested_mimetype = mimeparse.best_match(["text/html", "application/json"], web.ctx.environ['HTTP_ACCEPT'])

		if property_name == None:
			status = remote.player.Status()

			if status.has_key("Metadata"):
				if status['Metadata'].has_key("mpris:artUrl"):
					import base64, urllib2, Image, StringIO
					image_file = urllib2.urlopen(str(status['Metadata']['mpris:artUrl']))
					image_string = StringIO.StringIO(image_file.read())
					image_object = Image.open(image_string)
					image_object.thumbnail((256,256),Image.BILINEAR)
					image_buffer = StringIO.StringIO()
					image_object.save(image_buffer, format="JPEG")
					b64_data = base64.b64encode(image_buffer.getvalue())
					status['Metadata']['mpris:artUrl'] = b64_data
					image_file.close()

			if requested_mimetype == "application/json":
				web.header('Content-Type', "application/json")
				return json.dumps(status)
		else:
			if property_name == "Position":
				property_value = remote.player.get_property("Position")
			if property_name == "LoopStatus":
				property_value = remote.player.get_property("LoopStatus")
			if property_name == "Shuffle":
				property_value = remote.player.get_property("Shuffle")
			if property_name == "Volume":
				property_value = remote.player.get_property("Volume")

			web.header('Content-Type', "application/json")
			return json.dumps({ property_name: property_value })

	def POST(self, player_name, property_name=None):
		try:
			remote = remote_factory(player_name)
		except:
			raise web.notfound()

		i = web.input()

		# Perform an action
		if property_name == None:
			action = i['action']

			if action == "Next":
				remote.player.Next()
			elif action == "PlayPause":
				remote.player.PlayPause()
			elif action == "Previous":
				remote.player.Previous()
		# Set a player properties
		else:
			new_value = i['new_value']

			if property_name == "Position":
				remote.player.set_property("Position", new_value)
			if property_name == "LoopStatus":
				remote.player.set_property("LoopStatus", new_value)
			if property_name == "Shuffle":
				if new_value.lower() == "true":
					new_value = True
				else:
					new_value = False
				remote.player.set_property("Shuffle", new_value)
			if property_name == "Volume":
				remote.player.set_property("Volume", float(new_value))

		raise web.ok

render = web.template.render("templates", base="base")

urls = (
	"/", "Index",
	"/(?P<player_name>\w+)/player/(?P<property_name>\w+)", "Player",
	"/(?P<player_name>\w+)/player/", "Player",
	"/(?P<player_name>\w+)/", "Remote",
)

app = web.application(urls, globals())

if __name__ == '__main__':
	app.run()
