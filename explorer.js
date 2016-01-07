define(['alkali/Updater'], function(Updater, cytoscape){
	function getAbsoluteX(element){
		var rect = element.getBoundingClientRect()
		return rect.left + window.pageXOffset - document.documentElement.clientLeft;
	}
	function getAbsoluteY(element){
		var rect = element.getBoundingClientRect()
		return rect.top + window.pageYOffset - document.documentElement.clientTop;
	}
	return function(options){
		var nextId = 1;
		var allElements = document.documentElement.getElementsByTagName('*');
		var container = document.body.appendChild(document.createElement('div'));
		container.style.position = 'absolute';
		container.style.left = '0px';
		container.style.right = '0px';
		container.style.top = '0px';
		container.style.bottom = '0px';
		container.style.fontFamily = 'sans-serif, Arial';
		container.style.fontSize = '10px';
		container.style.zIndex = '1000000';
		var boundX = container.offsetWidth;
		var boundY = container.offsetHeight;
		var configuration = {
			container: container,
			style: [ // the stylesheet for the graph
				{
					selector: 'node',
					style: {
						'label': 'data(label)',
						'text-valign': 'center'
					}
				},
				{
					selector: 'node[type="element"]',
					style: {
						opacity: 0.1,
						'background-color': '#00a',
						height: 'data(height)',
						width: 'data(width)',
						shape: 'rectangle',
						'z-index': 'data(zIndex)'
					}
				},
				{
					selector: 'node[type="renderer"]',
					style: {
						'background-color': '#444',
						shape: 'ellipse',
						width: '60px',
						height: '40px',
						'z-index': 10000
					}
				},
				{
					selector: 'node[type="variable"]',
					style: {
						'background-color': '#666',
						shape: 'rectangle',
						width: '80px',
						height: '40px',
						'z-index': 10000
					}
				},

				{
					selector: 'edge',
					style: {
						'width': 3,
						'label': 'data(label)',
						'line-color': '#ccc',
						'target-arrow-color': '#ccc',
						'target-arrow-shape': 'triangle'
					}
				}
			],
			zoom: 1,
  		pan: { x: 0, y: 0 },
  		zoomingEnabled: false,
		  userZoomingEnabled: false,
		  panningEnabled: false,
		  userPanningEnabled: false,
  		layout: {
				name: 'preset',
				boundingBox: {
					x1: 0,
					y1: 0,
					x2: boundX,
					y2: boundY
				},
				componentSpacing: 150,
				avoidOverlap: false
			}
		};
		var nodes = [];
		var edges = [];
		configuration.elements = {
			nodes: nodes,
			edges: edges
		};

		var processed = {};
		function valueToString(value){
			return fitString('' + value);
		}
		function fitString(string){
			if(string.length > 20){
				return string.slice(0, 20) + '...';
			}
			return string;
		}
		function placeNode(from){
			var best, bestScore = 1;
			var fromX = from.x;
			var fromY = from.y;
			for(var i = 0; i < 200000 / bestScore; i++){
				var possibleX = fromX + 200 * Math.cos(i);
				var possibleY = fromY + 200 * Math.sin(i * 1.43213);
				if(possibleX > 0 && possibleX < boundX - 100 && possibleY > 0 && possibleY < boundY - 50){
					var closest = 1000000000;
					for(var j = 0, l = nodes.length; j < l; j++){
						var nodePosition = nodes[j].position;
						var distance = (nodePosition.x - possibleX) * (nodePosition.x - possibleX) + (nodePosition.y - possibleY) * (nodePosition.y - possibleY);
						if (distance < closest){
							closest = distance;
						}
					}
					var score = closest - i * i * 10 + (possibleY - fromY) * (from.downstream ? 30 : -30) + 10000;
					if(score > bestScore){
						bestScore = score;
						best = {
							x: possibleX,
							y: possibleY,
							z: from.z || 100
						};
					}
				}
			}
			return best;
		}
		function editDialog(element){
			var box = container.appendChild(document.createElement('div'));
			var title = box.appendChild(document.createElement('div'));
			title.textContent = 'Edit value';
			var closeButton = box.appendChild(document.createElement('div'));
			closeButton.textContent = 'X';
			closeButton.style.float = 'right';
			closeButton.style.cursor = 'pointer';
			closeButton.addEventListener('click', function(){
				dismiss()
			});
			box.style.position = 'absolute';
			box.style.boxShadow = '2px 2px 3px #888';
			box.style.backgroundColor = '#eee';
			box.style.border = '1px solid #888';
			box.style.borderRadius = '3px';
			box.style.left = '400px';
			box.style.top = '300px';
			box.style.padding = '10px';
			box.style.zIndex = '10000';
			editArea = box.appendChild(document.createElement('textarea'));
			editArea.style.width = '500px';
			editArea.style.height = '250px';
			var variable = element.variable;
			var value = variable.valueOf();
			var asSource = typeof value === 'function' ? value.toString() : JSON.stringify(value, null, '\t');
			editArea.value = asSource;
			var ok = box.appendChild(document.createElement('button'));
			ok.style.display = 'block';
			ok.style.margin = '10px';
			ok.innerHTML = 'Save';
			ok.addEventListener('click', function(){
				try {
					variable.put(eval('(' + editArea.value + ')'));
					dismiss();
				}catch(error){
					alert(error);
				}
			});
			function dismiss(event){
				if(!event || !box.contains(event.target) && container.contains(box)){
					container.removeChild(box);
				}
				container.removeEventListener(dismiss);
			}
			container.addEventListener('click', dismiss);
		}
		function createVariableBox(position, text, parent){
			var box = (parent || container).appendChild(document.createElement('div'));
			if(!parent){
				box.style.position = 'absolute';
				box.style.left = position.x + 'px';
				box.style.top = position.y + 'px';
			}else{
				box.style.margin = '5px';
			}
			box.style.boxShadow = '2px 2px 3px #888';
			box.style.backgroundColor = '#eee';
			box.style.border = '1px solid #888';
			box.style.borderRadius = '3px';
			box.style.padding = '4px';
			box.style.zIndex = position.z || 100;
			box.textContent = text;
			if(!position.x || parent){
				position.x = getAbsoluteX(box);
				position.y = getAbsoluteY(box);
			}
			position.height = box.offsetHeight;
			position.width = box.offsetWidth;
			return box;
		}
		function addConnection(source, target, label){
			var arrow = container.appendChild(document.createElement('div'));
			var arrowTriangle = arrow.appendChild(document.createElement('div'));
			arrowTriangle.style.position = 'absolute';
			arrowTriangle.style.left = '80%';
			arrowTriangle.style.top = '-7px';
			arrowTriangle.style.width = '0';
			arrowTriangle.style.height = '0';
			arrowTriangle.style.borderTop = '10px solid transparent';
			arrowTriangle.style.borderBottom = '10px solid transparent';
			arrowTriangle.style.borderLeft = '10px solid #888';
			arrow.style.position = 'absolute';
			var sourceX = source.x + (source.width || 100) / 2;
			var sourceY = source.y + (source.height || 30) / 2;
			var targetX = target.x + (target.width || 100) / 2;
			var targetY = target.y + (target.height || 30) / 2;
			arrow.style.left = sourceX + 'px';
			arrow.style.top = sourceY + 'px';
			arrow.style.backgroundColor = '#888';
			arrow.style.height = '4px';
			arrow.style.width = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)) + 'px';
			arrow.style.zIndex = Math.min(source.z, target.z) - 1;
			arrow.style.transformOrigin = '0 0';
			var angle = Math.atan((targetY - sourceY) / (targetX - sourceX));
			if(targetX < sourceX){
				angle += Math.PI;
			}
			arrow.style.transform = 'rotate(' + angle + 'rad)';
			return arrow;
			/*cy.add({
				group: 'edges',
				data: {
					label: label,
					source: source,
					target: target
				}
			});*/
		}
		function processVariable(variable, position, parent, key){
			var variableId;
			if(variable.parent){
				processVariable(variable.parent, placeNode({x: position.x, y: position.y, z: position.z - 2}));
			}
			if(variable.getId){
				variableId = 'variable-' + variable.getId();
			}else{
				variableId = 'subscriber-' + (variable.id || (variable.id = nextId++));
			}
			if(processed[variableId]){
				return processed[variableId];
			}
			processed[variableId] = position;
			var variableNode = {
				group: 'nodes',
				data: {
					type: 'variable',
					parent: parent,
					shape: variable._properties ? 
						'octagon' : variable.functionVariable ?
						'diamond' : 'rectangle',
					label: valueToString(variable.valueOf()),
					value: variable,
					id: variableId
				},
				position: position
			};
			//cy.add(variableNode);
			var variableBox = position.element = createVariableBox(position, '', parent && parent.element);
			var labelNode = variableBox.appendChild(document.createElement('span'));
			labelNode.textContent = 'undefined';
			if(key){
				labelNode.textContent = key + ': undefined';
			}
			new Updater.ElementUpdater({
				element: labelNode,
				variable: variable,
				renderUpdate: function(newValue){
					var label = '' + newValue;
					if(key){
						label = key + ': ' + label;
					}
					labelNode.textContent = fitString(label);
				}
			});

			variableBox.variable = variable;
			nodes.push(variableNode);
			var i = 0;
			for(var childKey in variable._properties){
				i++;
				processVariable(variable._properties[childKey], {z: position.z + 2}, position, childKey);
			}
			position.downstream = true;
			var args = variable.args;
			if(args){
				for(var i = 0; i < args.length; i++){
					addConnection(processVariable(args[i], placeNode(position)), position, '' + i);
				}
			}
			if(variable.functionVariable){
				addConnection(processVariable(variable.functionVariable, {x: 10, y: 40}, position), position, 'map');
			}
			if(variable.notifyingValue){
				addConnection(processVariable(variable.notifyingValue, placeNode(position)), position, 'value');
			}
			return processed[variableId] = position;
		}

		for(var i = 0, l = allElements.length; i < l; i++){
			var element = allElements[i];
			if(element.offsetParent && element.alkaliRenderers){
				var height = element.offsetHeight;
				var width = element.offsetWidth;
				var elementOverlay = container.appendChild(document.createElement('div'));
				elementOverlay.style.position = 'absolute';
				elementOverlay.style.left = getAbsoluteX(element) + 'px';
				elementOverlay.style.top = getAbsoluteY(element) + 'px';
				elementOverlay.style.width = width + 'px';
				elementOverlay.style.height = height + 'px';
				elementOverlay.style.backgroundColor = '#00f';
				elementOverlay.style.opacity = 0.2;
				elementOverlay.style.zIndex = 1;
				elementOverlay.className = 'element-overlay';
				elementOverlay.nodeId = 'element-' + i;
				elementOverlay.targetElement = element;
				nodes.push({
					data:{
						type: 'element',
						height: height,
						width: width,
						opacity: 0.1,
						zIndex: i,
						element: element,
						label: element.tagName + element.className.replace(/\S+/g, function(part){
							return '.' + part;
						}),
						id: 'element-' + i
					},/*
					position: {
						x: 40,
						y: 40
					},
					locked: true
	*/
					
					position: window.$ ? {
						x: getAbsoluteX(element) + width / 2,
						y: getAbsoluteY(element) + height / 2
					}: {
						x: 0,
						y: 0
					},
					locked: true
				});


	//console.log($(element).position().left, $(element).position().top);
			}
		}
		//cy = cytoscape(configuration);
		container.addEventListener('click', function(event){
			var litmusElement = event.target;
			while(litmusElement){
				if(litmusElement == container){
					return;
				}
				if(litmusElement.variable){
					editDialog(litmusElement);
					return;
				}
				if(litmusElement.targetElement){
					var element = litmusElement.targetElement;
					if(element){
						var id = event.target.nodeId;
						var elementPosition = {
							x: litmusElement.offsetLeft,
							y: litmusElement.offsetTop,
							z: 100
						};
						var renderers = element.alkaliRenderers;
						for(var j = 0; j < renderers.length; j++){
							var renderer = renderers[j];
							var rendererNode = {
								group: 'nodes',
								data: {
									type: 'renderer',
									label: fitString('Renderer'),
									value: renderer.name || renderer.renderUpdate,
									id: 'updater-' + renderer.getId()
								},
								position: placeNode(elementPosition)
							};
							var rendererPosition = placeNode(elementPosition);
							var rendererBox = createVariableBox(rendererPosition, fitString('Renderer ' + (renderer.name || '')));

							//cy.add(rendererNode);
							nodes.push(rendererNode);
							addConnection(rendererPosition, elementPosition, '');
							addConnection(processVariable(renderer.variable, placeNode(rendererNode.position)), rendererPosition, '');
						}

					}
					return;
				}
				litmusElement = litmusElement.parentNode;
			}
//			cy.layout(configuration.layout);
		});
	};
});