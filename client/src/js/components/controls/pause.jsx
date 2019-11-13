import React from 'react'

const Pause = ({clickHandler, disabled}) => (
	<button className="btn btnPause"
	        onClick={clickHandler}
	        disabled={disabled}>
		<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#pause"></use></svg>
		<span>Pause</span>
	</button>
)

export default Pause
