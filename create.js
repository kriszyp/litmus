define([], function(){
	// an API designed for creating elements with style. Not something you would normally want to do,
	// unless you happen to be building a UI from a bookmarklet
	var create = function(parent, tagName, styles){
		var element = parent.appendChild(document.createElement(tagName));
		for(var name in styles){
			element.style[name] = styles[name];
		}
		return element;
	};
	function makeTriangle(parent){
		return create(parent, 'div', {
			width: '10px',
			height: '0',
			borderTop: '6px solid transparent',
			borderBottom: '6px solid transparent',
			borderLeft: '6px solid #888'
		});
	}
	create.triangle = makeTriangle;
	return create;
});