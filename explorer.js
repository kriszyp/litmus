define(['cytoscape/dist/cytoscape'], function(cytoscape){
	return function(options){
		var nextId = 1;
		var allElements = document.documentElement.getElementsByTagName('*');
		var container = document.body.appendChild(document.createElement('div'));
		container.style.position = 'absolute';
		container.style.left = '0px';
		container.style.right = '0px';
		container.style.top = '0px';
		container.style.bottom = '0px';
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
				if(possibleX > 0 && possibleX < boundX && possibleY > 0 && possibleY < boundY){
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
							y: possibleY
						};
					}
				}
			}
			return best;
		}
		function addConnection(source, target, label){
			cy.add({
				group: 'edges',
				data: {
					label: label,
					source: source,
					target: target
				}
			});
		}
		function processVariable(variable, from){
			var variableId;
			if(variable.getId){
				variableId = 'variable-' + variable.getId();
			}else{
				variableId = 'subscriber-' + (variable.id || (variable.id = nextId++));
			}
			if(processed[variableId]){
				return variableId;
			}
			processed[variableId] = true;
			var position = placeNode(from);
			var variableNode = {
				group: 'nodes',
				data: {
					type: 'variable',
					shape: variable._properties ? 
						'octagon' : variable.functionVariable ?
						'diamond' : 'rectangle',
					label: valueToString(variable.valueOf()),
					value: variable,
					id: variableId
				},
				position: position
			};
			cy.add(variableNode);
			nodes.push(variableNode);
			for(var i in variable._properties){
				addConnection(variableId, processVariable(variable._properties[i], position), i);
			}
			position.downstream = true;
			var args = variable.args;
			if(args){
				for(var i = 0; i < args.length; i++){
					addConnection(processVariable(args[i], position), variableId, '' + i);
				}
			}
			if(variable.functionVariable){
				addConnection(processVariable(variable.functionVariable, position), variableId, 'map');
			}
			if(variable.notifyingValue){
				addConnection(processVariable(variable.notifyingValue, position), variableId, 'value');
			}
			if(variable.parent){
				processVariable(variable.parent, position);
			}
			return variableId;
		}

		for(var i = 0, l = allElements.length; i < l; i++){
			var element = allElements[i];
			if(element.offsetParent && element.alkaliRenderers){
				var height = element.offsetHeight;
				var width = element.offsetWidth;
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
						x: $(element).offset().left + width / 2,
						y: $(element).offset().top + height / 2
					}: {
						x: 0,
						y: 0
					},
					locked: true
				});

	//console.log($(element).position().left, $(element).position().top);
			}
		}
		cy = cytoscape(configuration);
		cy.on('click', function(event){
			if(!event.cyTarget.data){
				return;
			}
			var element = event.cyTarget.data('element');
			if(!element){
				var value = event.cyTarget.data('value');
				if(value){
					value = value.valueOf();
					try{
						if(typeof value != 'function'){
							value = JSON.stringify(value);
						}
					}catch(e){}
					alert(value);
				}
				return;
			}

			var id = event.cyTarget.data('id');
			var elementPosition = event.cyTarget.position();
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
				}
				cy.add(rendererNode);
				nodes.push(rendererNode);
				addConnection('updater-' + renderer.getId(), id, '');
				addConnection(processVariable(renderer.variable, rendererNode.position), 'updater-' + renderer.getId(), '');
			}
//			cy.layout(configuration.layout);
		});
	};
});