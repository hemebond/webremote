#!flask/bin/python

import os, re, dbus, mpris2, json, imghdr
from flask import Flask, jsonify, request, url_for, render_template, abort, send_from_directory


ALBUM_ART = {
	'rhythmbox': os.path.expanduser('~/.cache/rhythmbox/album-art'),
	'Noise': os.path.expanduser('~/.cache/noise/album-art'),
}


def get_application_list():
	mpris2_bus_regex = re.compile('^org\.mpris\.MediaPlayer2\.(?P<application>\w+)(?:\.(?P<instance>\w+))?')
	bus = dbus.SessionBus()
	bus_names = bus.list_names()

	applications = []

	for path in bus_names:
		match = mpris2_bus_regex.match(path)

		if match:
			application = mpris2.Application(path)
			app_name, instance = match.groups()

			applications.append({
				'name': app_name,
				'path': path,
				'obj': application
			})

	return applications


def get_application(app_name):
	"""
	Returns an mpris2 application object
	"""
	app_list = get_application_list()

	for app in app_list:
		if app['name'] == app_name:
			return app['obj']

	return None


def request_wants_jsonapi():
	best = request.accept_mimetypes.best_match(['application/vnd.api+json', 'text/html'])
	return best == 'application/vnd.api+json' and request.accept_mimetypes[best] > request.accept_mimetypes['text/html']


def request_wants_json():
	best = request.accept_mimetypes.best_match(['application/json', 'text/html'])
	return best == 'application/json' and request.accept_mimetypes[best] > request.accept_mimetypes['text/html']


app = Flask(__name__)


@app.route('/', methods=['GET'])
def index():
	# return the dict of applications as a JSON array
	# {"my_application": "My Application"}

	# JSON API
	applications = get_application_list()
	data = []

	for app in applications:
		data.append(
			{
				'id': app['name'],
				'type': "application",
				'attributes': {
					'CanQuit': getattr(app['obj'], 'CanQuit', False),
					'Fullscreen': getattr(app['obj'], 'Fullscreen', False),
					'CanSetFullscreen': getattr(app['obj'], 'CanSetFullscreen', False),
					'CanRaise': getattr(app['obj'], 'CanRaise', False),
					'HasTrackList': getattr(app['obj'], 'HasTrackList', False),
					'Identity': getattr(app['obj'], 'Identity', ''),
					'DesktopEntry': getattr(app['obj'], 'DesktopEntry', ''),
					'SupportedUriSchemes': getattr(app['obj'], 'SupportedUriSchemes', []),
					'SupportedMimeTypes': getattr(app['obj'], 'SupportedMimeTypes', []),
				},
				'links': {
					'self': url_for('application', app_name=app['name'])
				}
			}
		)

	links = {}

	if request_wants_json():
		return jsonify({
			'data': data,
			'links': links
		})

	return render_template('jsonapi.html', data=data, links=links)


@app.route('/<app_name>/', methods=['GET'])
@app.route('/<app_name>/<action>', methods=['POST'])
def application(app_name, action=None):
	app = get_application(app_name)

	if app is None:
		abort(404)

	data = {
		'id': app_name,
		'type': "application",
		'attributes': {
			'CanQuit': getattr(app, 'CanQuit', False),
			'Fullscreen': getattr(app, 'Fullscreen', False),
			'CanSetFullscreen': getattr(app, 'CanSetFullscreen', False),
			'CanRaise': getattr(app, 'CanRaise', False),
			'HasTrackList': getattr(app, 'HasTrackList', False),
			'Identity': getattr(app, 'Identity', ''),
			'DesktopEntry': getattr(app, 'DesktopEntry', ''),
			'SupportedUriSchemes': getattr(app, 'SupportedUriSchemes', []),
			'SupportedMimeTypes': getattr(app, 'SupportedMimeTypes', []),
		},
		'relationships': {
			'player': {
				'data': {
					'id': app_name,
					'type': 'player',
				},
				'links': {
					'self': url_for('player', app_name=app_name),
				}
			},
			'playlists': {
				'data': {
					'id': app_name,
					'type': 'playlists',
				},
				'links': {
					'self': url_for('playlists', app_name=app_name),
				}
			}
		}
	}

	links = {
		'self': url_for('application', app_name=app_name),
	}

	if request_wants_json():
		return jsonify({
			'data': data,
			'links': links
		})

	return render_template('jsonapi.html', data=data, links=links)


@app.route('/<app_name>/player/', methods=['GET'])
@app.route('/<app_name>/player/<action>', methods=['POST'])
def player(app_name, action=None):
	app = get_application(app_name)
	player = app.player

	# Sort out the metadata
	metadata = getattr(player, 'Metadata', {})

	if metadata != {}:
		if 'mpris:artUrl' in metadata:
			# file:///home/user/.cache/rhythmbox/album-art/001/6c2

			if metadata['mpris:artUrl'].startswith("file://"):
				for app, album_art_path in ALBUM_ART.items():
					# file:///home/user/.cache/rhythmbox/album-art
					art_cache_url = 'file://' + album_art_path

					if metadata['mpris:artUrl'].startswith(art_cache_url):
						# 001/6c2
						rel_img_path = metadata['mpris:artUrl'].replace(art_cache_url + '/', '')

						# /rhythmbox/art/001/6c2
						metadata['mpris:artUrl'] = "/%s/art/%s" % (app_name, rel_img_path)

	data = {
		'id': app_name,
		'type': "player",
		'attributes': {
			'PlaybackStatus': getattr(player, 'PlaybackStatus', 'Stopped'),
			'LoopStatus': getattr(player, 'LoopStatus', 'None'),
			'Rate': getattr(player, 'Rate', 1.0),
			'Shuffle': getattr(player, 'Shuffle', False),
			'Metadata': metadata,
			'Volume': getattr(player, 'Volume', 0.0),
			'Position': getattr(player, 'Position', 0),
			'MinimumRate': getattr(player, 'MinimumRate', 1.0),
			'MaximumRate': getattr(player, 'MaximumRate', 1.0),
			'CanGoNext': getattr(player, 'CanGoNext', False),
			'CanGoPrevious': getattr(player, 'CanGoPrevious', False),
			'CanPlay': getattr(player, 'CanPlay', False),
			'CanPause': getattr(player, 'CanPause', False),
			'CanSeek': getattr(player, 'CanSeek', False),
			'CanControl': getattr(player, 'CanControl', False),
		}
	}

	links = {
		'self': url_for('player', app_name=app_name),
		'application': url_for('application', app_name=app_name),
		'playlists': url_for('playlists', app_name=app_name),
	}

	if request_wants_json():
		return jsonify({
			'data': data,
			'links': links
		})

	return render_template('jsonapi.html', data=data, links=links)


@app.route('/<app_name>/art/<path:img_name>', methods=['GET'])
def art(app_name, img_name):
	try:
		art_dir = ALBUM_ART[app_name]
	except KeyError as e:
		abort(404)

	print(img_name)

	img_type = imghdr.what(
		os.path.join(art_dir, img_name)
	)

	return send_from_directory(art_dir, img_name, mimetype='image/%s' % img_type)


@app.route('/<app_name>/playlists/', methods=['GET'])
def playlists(app_name):
	return ''


if __name__ == '__main__':
	app.run(debug=True)
