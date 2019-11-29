import os
import re, dbus, json, mpris2


def get_application_list():
	'''
	Return a list of dicts of the currently
	running MPRIS2-compatible applications
	'''
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


def get_art_directory(application_name):
	'''
	Lookup the directory containing album art for this application
	'''
	user_home_dir = os.path.expanduser("~")

	art_directories = {
		'rhythmbox': os.path.join(user_home_dir, '.cache/rhythmbox/album-art'),
		'Noise': os.path.join(user_home_dir, '.cache/noise/album-art'),
	}

	# will raise a KeyError if there's no art directory
	# for the application
	return art_directories[application_name]


def get_application(application_name):
	application_list = get_application_list()

	for app in application_list:
		if app['name'] == application_name:
			return mpris2.Application(app['bus'])

	raise KeyError()


def call_method(mpris_object, method, parameters={}):
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
