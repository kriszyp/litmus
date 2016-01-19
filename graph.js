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
						y: cell.y + cell.height + 5,
						moved: cell.y + cell.height - position.y + 5
					};
				}else{
					// move up
					newPosition = {
						x: position.x,
						y: cell.y - position.height - 5,
						moved: (position.y + position.height) - cell.y + 5
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
		var right = tryPosition({x: fromX + 200, y: fromY, height: from.height, width: from.width});
		if(right.moved){
			var left = tryPosition({x: fromX - 200, y: fromY, height: from.height, width: from.width});
			if(left.moved + 10 > right.moved){
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
		var sourceX = source.x;
		var sourceY = source.y;
		var targetX = target.x;
		var targetY = target.y;
		var angle = Math.atan((targetY - sourceY) / (targetX - sourceX));
		if(targetX < sourceX){
			angle += Math.PI;
		}
		var arrowContainer = create(container, 'div');
		var arrow = create(arrowContainer, 'div', {
			position: 'absolute',
			left: sourceX + 'px',
			top: sourceY + 'px',
			backgroundColor: '#888',
			height: '3px',
			width: Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)) + 'px',
			zIndex: 200,
			transformOrigin: '0 0',
			transform: 'rotate(' + angle + 'rad)'
		});
		var arrowTriangle = create.triangle(arrow, 9);
		arrowTriangle.style.position = 'absolute';
		arrowTriangle.style.left = '50%';
		arrowTriangle.style.top = '-7px';
		midX = (sourceX + targetX) / 2;
		midY = (sourceY + targetY) / 2;
		labelNode = create(arrowContainer, 'div', {
			position: 'absolute',
			left: midX + 'px',
			top: midY + 'px',
			zIndex: 200
		});
		labelNode.textContent = label;
		return arrowContainer;
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
	var allEdges = [];
	function drawEdges(edges){
		edges.forEach(function(edge){
			if(edge.element && edge.element.parentNode){
				edge.element.parentNode.removeChild(edge.element);
			}
			if(edge.source.offsetParent && edge.target.offsetParent){
				var source = getPosition(edge.source);
				var target = getPosition(edge.target);
				if(source.x < target.x){
					source.x += source.width;
				}else{
					target.x += target.width;
				}
				var slope = Math.max(0, Math.min(1, (target.y - source.y) / Math.abs(target.x - source.x) + 0.5));
				source.y += source.height * slope;
				target.y += target.height * (1 - slope);
				edge.element = makeConnection(source, target, edge.label);
			}
		});

	}
	return {
		setContainer: function(containerElement){
			container = containerElement;
			columns = [];
		},
		layout: function(nodes, edges){
			nodes.forEach(function(node){
				var to = node.to;
				if(to){
					var toPosition = getAbsolutePosition(to);
					toPosition.width = node.offsetWidth;
					toPosition.height = node.offsetHeight;
					var position = findPosition(toPosition);
					node.style.left = position.x + 'px';
					node.style.top = position.y + 'px';
				}
			});
			drawEdges(edges);
			allEdges = allEdges.concat(edges);
		},
		refresh: function(){
			drawEdges(allEdges);
		}
	};
});
