import React from 'react'

function VolumeBar(props) {
	let volume = {width: (props.player.Volume * 100) + '%'};
	return (
		<div className="volume">
			<div className="bar" style={volume}></div>
		</div>
	)
}

const Volume = ({player, btnVolumeUp, btnVolumeDn}) => (
	<div className="volume-panel">
		<button className="btn btnVolumeDown"
		        onClick={btnVolumeDn}
		        disabled={!player.CanControl}>
			<svg aria-hidden="true" focusable="false" className="svg-icon">
				<use xlinkHref="#volume-down"></use>
			</svg>
			<span>Decrease</span>
		</button>

		<VolumeBar player={player} />

		<button className="btn btnVolumeUp"
		        onClick={btnVolumeUp}
		        disabled={!player.CanControl}>
			<svg aria-hidden="true" focusable="false" className="svg-icon">
				<use xlinkHref="#volume-up"></use>
			</svg>
			<span>Increase</span>
		</button>
	</div>
)

export default Volume