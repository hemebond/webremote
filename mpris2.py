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
from utils import to_native_type

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
		return str(dbus.Signature(data))
	else:
		return int(data)

def str2bool(value):
	return {'true': True, 'false': False}[value.lower()]


class PlayerNotRunning(Exception):
	pass


class Player(object):
	INTERFACE = "%s.Player" % mpris2_interface

	def __init__(self, bus_object):
		self.dbus_interface = dbus.Interface(bus_object, dbus_interface=self.INTERFACE)
		self.dbus_properties = dbus.Interface(bus_object, dbus.PROPERTIES_IFACE)

	def get_property(self, property_name):
		try:
			property_value = to_native_type(self.dbus_properties.Get(self.INTERFACE, property_name))
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
		if property_name == "Position":
			metadata = self.get_property("Metadata")
			if metadata.has_key("mpris:length"):
				#new_position = float(new_position) * float(metadata['mpris:length'])
				#self.dbus_interface.SetPosition(str(metadata['mpris:trackid']), new_position)
				pass
		else:
			self.dbus_properties.Set(self.INTERFACE, property_name, new_value)

	def Next(self):
		self.dbus_interface.Next()

	def Previous(self):
		self.dbus_interface.Previous()

	def Pause(self):
		self.dbus_interface.Pause()

	def PlayPause(self):
		self.dbus_interface.PlayPause()

	def Stop(self):
		self.dbus_interface.Stop()

	def Play(self):
		self.dbus_interface.Play()

	def Seek(self, offset):
		pass

	def SetPosition(self, trackid, position):
		print 'trackid: %s' % trackid
		print 'position: %s' % position
		self.dbus_interface.SetPosition(trackid, position)

	def OpenUri(self, uri):
		pass

	@property
	def PlaybackStatus(self):
		return self.get_property("PlaybackStatus")

	@property
	def LoopStatus(self):
		return self.get_property("LoopStatus")

	@LoopStatus.setter
	def LoopStatus(self, value):
		self.set_property("LoopStatus", value)

	@property
	def Rate(self):
		return self.get_property("Rate")

	@Rate.setter
	def Rate(self, value):
		self.set_property("Rate", value)

	@property
	def Shuffle(self):
		return self.get_property("Shuffle")

	@Shuffle.setter
	def Shuffle(self, value):
		self.set_property("Shuffle", value)

	@property
	def Metadata(self):
		return self.get_property("Metadata")

	@property
	def Volume(self):
		return self.get_property("Volume")

	@Volume.setter
	def Volume(self, value):
		self.set_property("Volume")

	@property
	def Position(self):
		return self.get_property("Position")

	@property
	def MinimumRate(self):
		return self.get_property("MinimumRate")

	@property
	def MaximumRate(self):
		return self.get_property("MaximumRate")

	@property
	def CanGoNext(self):
		return self.get_property("CanGoNext")

	@property
	def CanGoPrevious(self):
		return self.get_property("CanGoPrevious")

	@property
	def CanPlay(self):
		return self.get_property("CanPlay")

	@property
	def CanPause(self):
		return self.get_property("CanPause")

	@property
	def CanSeek(self):
		return self.get_property("CanSeek")

	@property
	def CanControl(self):
		return self.get_property("CanControl")


class Playlists(object):
	INTERFACE = "%s.Playlists" % mpris2_interface

	def __init__(self, bus_object):
		self.dbus_interface = dbus.Interface(bus_object, dbus_interface=self.INTERFACE)
		self.dbus_properties = dbus.Interface(bus_object, dbus.PROPERTIES_IFACE)

	def get_property(self, property_name):
		value = self.dbus_properties.Get(self.INTERFACE, property_name)
		return to_native_type(value)

	def set_property(self, property_name, new_value):
		self.dbus_properties.Set(self.INTERFACE, property_name, new_value)

	def ActivatePlaylist(self, playlist_id):
		self.dbus_interface.ActivePlaylist(playlist_id)

	def GetPlaylists(self, index=0, max_count=255, order='Alphabetical', reverse=False):
		playlists = self.dbus_interface.GetPlaylists(index, max_count, order, reverse)
		return to_native_type(playlists)

	@property
	def PlaylistCount(self):
		return self.get_property("PlaylistCount")

	@property
	def Orderings(self):
		return self.get_property("Orderings")

	@property
	def ActivePlaylist(self):
		return self.get_property("ActivePlaylist")


class Application(object):
	INTERFACE = mpris2_interface

	def __init__(self, path):
		self.bus = dbus.SessionBus()
		self.path = path

		try:
			bus_object = self.bus.get_object(self.path, mpris2_object_path)
		except:
			raise PlayerNotRunning()

		self.dbus_interface = dbus.Interface(bus_object, dbus_interface=self.INTERFACE)
		self.dbus_properties = dbus.Interface(bus_object, dbus.PROPERTIES_IFACE)
		self.player = Player(bus_object)
		self.playlists = Playlists(bus_object)

	def get_property(self, property_name):
		value = self.dbus_properties.Get(self.INTERFACE, property_name)
		return to_native_type(value)

	def set_property(self, property_name, new_value):
		self.dbus_properties.Set(self.INTERFACE, property_name, new_value)

	def Raise(self):
		self.dbus_interface.Raise()

	def Quit(self):
		self.dbus_interface.Quit()

	@property
	def CanQuit(self):
		return self.get_property("CanQuit")

	@property
	def Fullscreen(self):
		return self.get_property("Fullscreen")

	@Fullscreen.setter
	def Fullscreen(self, value):
		self.set_property("Fullscreen", value)

	@property
	def CanSetFullscreen(self):
		return self.get_property("CanSetFullscreen")

	@property
	def CanRaise(self):
		return self.get_property("CanRaise")

	@property
	def HasTrackList(self):
		return self.get_property("HasTrackList")

	@property
	def Identity(self):
		return self.get_property("Identity")

	@property
	def DesktopEntry(self):
		return self.get_property("DesktopEntry")

	@property
	def SupportedUriSchemes(self):
		return self.get_property("SupportedUriSchemes")

	@property
	def SupportedMimeTypes(self):
		return self.get_property("SupportedMimeTypes")
