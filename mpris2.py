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

import dbus, re, sys

mpris2_re = re.compile('^org\.mpris\.MediaPlayer2\.([^.]+)$')
mpris2_object_path = "/org/mpris/MediaPlayer2"
mpris2_interface = "org.mpris.MediaPlayer2"

# From http://code.google.com/p/dbus-tools/
# Transform dbus types into native types
def to_native_type(data):
	if isinstance(data, dbus.Struct):
		return tuple(to_native_type(x) for x in data)
	elif isinstance(data, dbus.Array):
		return [to_native_type(x) for x in data]
	elif isinstance(data, dbus.Dictionary):
		return dict((to_native_type(k), to_native_type(v)) for (k, v) in data.items())
	elif isinstance(data, dbus.Double):
		return float(data)
	elif isinstance(data, dbus.Boolean):
		return bool(data)
	elif isinstance(data, (dbus.String, dbus.ObjectPath)):
		return unicode(data)
	elif isinstance(data, dbus.Signature):
		return str(Signature(data))
	else:
		return int(data)

class PlayerNotRunning(Exception):
	pass

class Player:
	def __init__(self, bus_object):
		self.dbus_interface = dbus.Interface(bus_object, dbus_interface=mpris2_interface + ".Player")
		self.dbus_properties = dbus.Interface(bus_object, dbus.PROPERTIES_IFACE)

	def get_property(self, property_name):
		interface = mpris2_interface + ".Player"
		try:
			property_value = to_native_type(self.dbus_properties.Get(interface, property_name))
		except:
			property_value = None

		if property_name == "Position":
			metadata = self.get_property("Metadata")
			if metadata.has_key("mpris:length"):
				if property_value != None:
					property_value = float(property_value) / float(metadata['mpris:length'])
				else:
					property_value = 0
			else:
				property_value = 0

		return property_value

	def set_property(self, property_name, new_value):
		interface = mpris2_interface + ".Player"

		if property_name == "Position":
			metadata = self.get_property("Metadata")
			if metadata.has_key("mpris:length"):
				new_position = float(new_position) * float(metadata['mpris:length'])
				self.dbus_interface.SetPosition(str(metadata['mpris:trackid']), new_position)
		else:
			self.dbus_properties.Set(interface, property_name, new_value)

	def Next(self):
		self.dbus_interface.Next()

	def PlayPause(self):
		self.dbus_interface.PlayPause()

	def Previous(self):
		self.dbus_interface.Previous()

	def Status(self):
		status = {}

		metadata = self.get_property("Metadata")
		if any(metadata):
			status['Metadata'] = metadata

#			Work-around for Clementine
#			http://code.google.com/p/clementine-player/issues/detail?id=1058
			artist = status['Metadata']['xesam:artist']
			if isinstance(artist, (str, unicode)):
				status['Metadata']['xesam:artist'] = [artist]

		status['Position'] = self.get_property("Position")
		status['PlaybackStatus'] = self.get_property("PlaybackStatus")
		status['Shuffle'] = self.get_property("Shuffle")
		status['LoopStatus'] = self.get_property("LoopStatus")
		status['Volume'] = self.get_property("Volume")
#		print status
		return status

class Remote:
	def __init__(self, path):
		self.bus = dbus.SessionBus()
		self.path = path

		try:
			bus_object = self.bus.get_object(self.path, mpris2_object_path)
		except:
			raise PlayerNotRunning()

		self.dbus_interface = dbus.Interface(bus_object, dbus_interface=mpris2_interface)
		self.dbus_properties = dbus.Interface(bus_object, dbus.PROPERTIES_IFACE)
		self.player = Player(bus_object)

		self.Identity  = self.get_property("Identity")
		self.CanQuit  = self.get_property("CanQuit")
		self.CanRaise = self.get_property("CanRaise")

	def get_property(self, property_name):
		interface = mpris2_interface
		return to_native_type(self.dbus_properties.Get(interface, property_name))

	def set_property(self, property_name, new_value):
		interface = mpris2_interface
		self.dbus_properties.Set(interface, property_name, new_value)

	def Raise(self):
		self.dbus_interface.Raise()

	def Quit(self):
		self.dbus_interface.Quit()
