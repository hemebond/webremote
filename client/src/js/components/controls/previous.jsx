import React from 'react'

const Previous = ({clickHandler, disabled}) => (
	<button className="btn btnPrev"
	        onClick={clickHandler}
	        disabled={disabled}>
		<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#prev"></use></svg>
		<span>Previous</span>
	</button>
)

export default Previous
