define(['./create'], function(create){
	// laying out the graph of connected nodes
	var columns = [];
	var container;
	var boundX = window.innerWidth;
	var boundY = window.innerHeight;
	function tryPosition(position){
		var column = columns[position.x];
		if(!column){
			columns[position.x] = column = [];
		}
		if(position.x < 0 || position.x > boundX) {
			return {
				moved: Infinity
			};
		}
		var newPosition = {
			x: position.x,
			y: position.y,
			moved: 0
		};
		for(var i = 0, l = column.length; i < l; i++){
			var cell = column[i];
			if(cell.y < position.y + position.height || cell.y + cell.height > position.y){
				// overlap with this cell
				var position;
				if(cell.y + cell.height / 2 < position.y + position.height / 2){
					// move down
					newPosition = {
						x: position.x,
						y: cell.y + cell.height,
						moved: cell.y + cell.height - position.y
					};
				}else{
					// move up
					newPosition = {
						x: position.x,
						y: cell.y - position.height,
						moved: cell.y - (position.y + position.height)
					};
				}
				break;
			}
		}
		if(position.height + newPosition.y > boundY){
			newPosition.moved += position.height + newPosition.y - boundY;
			newPosition.y = boundY - position.height;
		}
		if(newPosition.y < 0){
			newPosition.moved -= newPosition.y;
			newPosition.y = 0;
		}
		return newPosition;
	}
	function findPosition(from){
		var best, bestScore = 1;
		var fromX = from.x;
		var fromY = from.y;
		fromX = Math.floor(fromX / 200) * 200;
		var right = tryPosition({x: fromX + 200, y: fromY});
		if(right.moved){
			var left = tryPosition({x: fromX - 200, y: fromY});
			if(left.moved > right.moved){
				best = right;
			}else{
				best = left;
			}
		}else{
			best = right;
		}
		best.z = from.z;
		columns[best.x].unshift(best);
		return best;
	}

	function makeConnection(source, target, label){
		var sourceX = source.x + (source.width || 100) / 2;
		var sourceY = source.y + (source.height || 30) / 2;
		var targetX = target.x + (target.width || 100) / 2;
		var targetY = target.y + (target.height || 30) / 2;
		var angle = Math.atan((targetY - sourceY) / (targetX - sourceX));
		if(targetX < sourceX){
			angle += Math.PI;
		}
		var arrow = create(container, 'div', {
			position: 'absolute',
			left: sourceX + 'px',
			top: sourceY + 'px',
			backgroundColor: '#888',
			height: '4px',
			width: Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)) + 'px',
			zIndex: Math.min(source.z, target.z) - 1,
			transformOrigin: '0 0',
			transform: 'rotate(' + angle + 'rad)'
		});
		var arrowTriangle = create.triangle(arrow);
		arrowTriangle.style.position = 'absolute';
		arrowTriangle.style.left = '50%';
		arrowTriangle.style.top = '-7px';
		midX = sourceX + targetX / 2;
		midY = sourceY + targetY / 2;
		labelNode = create(container, 'div', {
			position: 'absolute',
			left: midX + 'px',
			top: midY + 'px',
		});
		labelNode.textContent = label;
		return arrow;
	}
	function getAbsolutePosition(node){
		if(node.offsetParent){
			parentPosition = getAbsolutePosition(node.offsetParent);
			return {
				x: node.offsetLeft + parentPosition.x,
				y: node.offsetTop + parentPosition.y
			};
		}
		return {
			x: node.offsetLeft,
			y: node.offsetTop
		};
	}

	function getPosition(node){
		var xy = getAbsolutePosition(node);
		return {
			x: xy.x,
			y: xy.y,
			height: node.offsetHeight,
			width: node.offsetWidth
		};
	}
	return {
		setContainer: function(containerElement){
			container = containerElement;
		},
		layout: function(nodes, edges){
			nodes.forEach(function(node){
				var to = node.to;
				if(to){
					var position = findPosition(getPosition(to));
					node.style.left = position.x + 'px';
					node.style.top = position.y + 'px';
				}
			});
			edges.forEach(function(edge){
				makeConnection(getPosition(edge.source), getPosition(edge.target), edge.label);
			});
		}
	};
});
