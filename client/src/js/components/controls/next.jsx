import React from 'react'

const Next = ({clickHandler, disabled}) => (
	<button className="btn btnNext"
	        onClick={clickHandler}
	        disabled={disabled}>
		<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#next"></use></svg>
		<span>Next</span>
	</button>
)

export default Next
