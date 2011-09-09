# Web Remote
Web Remote is a web interface to media players that implement the MPRIS D-Bus Interface Specification v2.1. It was created so I could control my audio and video players from my iPhone. Scratching an itch, as it were.

The whole thing was a learning project, there are still a lot of things to fix and implement.

Icons were created from the [Faenza icon theme](http://code.google.com/p/faenza-icon-theme/).

## Requirements
* [webpy](http://webpy.org/)
* [mimeparse](http://code.google.com/p/mimeparse/)
* Python 2.7.1+

## Usage
Run

	python ./webremote.py

and then browse to your PC from a web browser, e.g.,

	http://localhost:8080/

The default port for a webpy server is 8080.
