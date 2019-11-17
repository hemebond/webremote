import React from 'react'

function VolumeBar(props) {
	var volumeStyle = {width: (props.volume * 100) + '%'};
	return (
		<div className="volume">
			<div className="bar" style={volumeStyle}></div>
		</div>
	)
}

const Volume = ({volume, canControl, btnVolumeUp, btnVolumeDn}) => (
	<div className="volume-panel">
		<button className="btn btnVolumeDown"
		        onClick={btnVolumeDn}
		        disabled={!canControl}>
			<svg aria-hidden="true" focusable="false" className="svg-icon">
				<use xlinkHref="#volume-down"></use>
			</svg>
			<span>Decrease</span>
		</button>

		<VolumeBar volume={volume} />

		<button className="btn btnVolumeUp"
		        onClick={btnVolumeUp}
		        disabled={!canControl}>
			<svg aria-hidden="true" focusable="false" className="svg-icon">
				<use xlinkHref="#volume-up"></use>
			</svg>
			<span>Increase</span>
		</button>
	</div>
)

export default Volume
