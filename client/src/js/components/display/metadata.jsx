import React from 'react'

function PlayerMetadata(props) {
	if (props.metadata == undefined) {
		return null;
	}
	else {
		return (
			<div className="metadata">
				<div className="art">
					<img src={ props.metadata['mpris:artUrl'] }/>
				</div>

				<div className="title">
					{ props.metadata['xesam:title'] }
				</div>

				<div className="artist">
					{ props.metadata['xesam:artist'].map(artist =>
						<span key={artist}>
							{ artist }
						</span>
					)}
				</div>

				<div className="album">
					{ props.metadata['xesam:album'] }
				</div>
			</div>
		);
	}
}

export default PlayerMetadata
