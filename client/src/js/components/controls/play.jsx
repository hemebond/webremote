import React from 'react'

const Play = ({clickHandler, disabled}) => (
	<button className="btn btnPlay"
	        onClick={clickHandler}
	        disabled={disabled}>
		<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#play"></use></svg>
		<span>Play</span>
	</button>
)

export default Play
