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

mpris_re = re.compile('^org\.mpris\.([^.]+)$')
#mpris_object_path = "/org/mpris/MediaPlayer2"
mpris_interface = "org.freedesktop.MediaPlayer"

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

class TrackList:
	def __init__(self, bus_object):
		self.dbus_interface = dbus.Interface(bus_object, dbus_interface="org.freedesktop.MediaPlayer")



class Player:
	def __init__(self, bus_object):
		self.dbus_interface = dbus.Interface(bus_object, dbus_interface="org.freedesktop.MediaPlayer")

	def get_property(self, property_name):
		if property_name == "LoopStatus":
			pass

	def Next(self):
		self.dbus_interface.Next()

	def PlayPause(self):
		self.dbus_interface.Pause()

	def Previous(self):
		self.dbus_interface.Prev()

#	def loopstatus(self, mode=None):
#		if mode == None:
#			status = self.dbus_interface.GetStatus()
#			if status[2]:
#				return "Track"
#			elif status[3]:
#				return "Playlist"
#			else:
#				return "None"
#		elif mode == "None":
#			self.dbus_interface.Repeat(False)
#		else:
#			self.dbus_interface.Repeat(True)

#	def Shuffle(self, value=None):
#		pass

	def Status(self):
		status = {}

#		metadata = self.get_property("Metadata")
#		if any(metadata):
#			status['Metadata'] = metadata

#		status['Position'] = self.get_property("Position")
#		status['PlaybackStatus'] = self.get_property("PlaybackStatus")
#		status['Shuffle'] = self.get_property("Shuffle")
#		status['LoopStatus'] = self.get_property("LoopStatus")
#		status['volume'] = self.get_property("Volume")
		return status

#	def volume(self, volume=None):
#		if volume == None:
#			try:
#				return self.get_property("Volume")
#			except dbus.exceptions.DBusException:
#				return None
#		else:
#			self.set_property("Volume", volume)

class Remote:
	def __init__(self, path):
		self.bus = dbus.SessionBus()
		self.path = path

		try:
			root_object = self.bus.get_object(self.path, "/")
			player_object = self.bus.get_object(self.path, "/Player")
		except:
			raise PlayerNotRunning()

		self.dbus_interface = dbus.Interface(root_object, dbus_interface="org.freedesktop.MediaPlayer")
#		self.dbus_properties = dbus.Interface(bus_object, dbus.PROPERTIES_IFACE)
		self.player = Player(player_object)

		self.Identity  = self.dbus_interface.Identity()
#		self.can_quit  = self.get_property("CanQuit")
#		self.can_raise = self.get_property("CanRaise")

	def get_property(self, property_name):
		interface = mpris2_interface
		return to_native_type(self.dbus_properties.Get(interface, property_name))

	def set_property(self, property_name, new_value):
		interface = mpris2_interface
		self.dbus_properties.Set(interface, property_name, new_value)

	def Raise(self):
		pass

	def Quit(self):
		self.dbus_interface.Quit()
