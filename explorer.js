define(['alkali/Updater', 'alkali/Variable', './graph', './create'], function(Updater, Variable, graph, create){
	function getAbsoluteX(element){
		var rect = element.getBoundingClientRect()
		return rect.left + window.pageXOffset - document.documentElement.clientLeft;
	}
	function getAbsoluteY(element){
		var rect = element.getBoundingClientRect()
		return rect.top + window.pageYOffset - document.documentElement.clientTop;
	}
	function instrumentVariableClass(Class){
		var originalPut = Class.prototype.put;
		Class.prototype.put = function(value){
			(this.changes || (this.changes = [])).push({
				old: this.valueOf(),
				'new': value,
				stack: new Error('Variable change').stack
			});
			return originalPut.apply(this, arguments);
		};
	}
	var instrumented = false;
	function instrumentVariables(){
		if(instrumented){
			return;
		}
		instrumented = true;
		instrumentVariableClass(Variable);
		instrumentVariableClass(Variable.Property);
		instrumentVariableClass(Variable.Call);
	}
	return function(options){
		var nextId = 1;
		var allElements = document.documentElement.getElementsByTagName('*');
		var container = create(document.body, 'div', {
			position: 'absolute',
			left: '0',
			top: '0',
			height: '0',
			right: '0',
			fontFamily: 'sans-serif, Arial',
			fontSize: '10px',
			zIndex: '1000000'
		});
		graph.setContainer(container);
		var boundX = window.innerWidth;
		var boundY = window.innerHeight;
		var nodes = [];
		var newNodes = [];
		var newEdges = [];

		var processed = {};
		function addConnection(source, target, label){
			newEdges.push({
				source: source,
				target: target,
				label: label
			});
		}
		function valueToString(value){
			return fitString('' + value);
		}
		function fitString(string){
			if(string.length > 20){
				return string.slice(0, 20) + '...';
			}
			return string;
		}
		function editDialog(element){
			var box = create(container, 'div', {
				position: 'absolute',
				boxShadow: '2px 2px 3px #888',
				backgroundColor: '#eee',
				border: '1px solid #888',
				borderRadius: '3px',
				left: '400px',
				top: '300px',
				padding: '10px',
				zIndex: '10000'
			});
			var closeButton = box.appendChild(document.createElement('div'));
			closeButton.textContent = 'X';
			closeButton.style.float = 'right';
			closeButton.style.cursor = 'pointer';
			closeButton.addEventListener('click', function(){
				dismiss();
			});
			var title = box.appendChild(document.createElement('div'));
			title.textContent = 'Edit value';
			editArea = box.appendChild(document.createElement('textarea'));
			editArea.style.width = '500px';
			editArea.style.height = '250px';
			var variable = element.variable;
			var value = variable.valueOf();
			try{
				var asSource = typeof value === 'function' ? value.toString() : JSON.stringify(value, null, '\t');
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
			}catch(error){
				asSource = error;
			}
			editArea.value = asSource;
			function dismiss(event){
				if(!event || !box.contains(event.target) && container.contains(box)){
					container.removeChild(box);
				}
				container.removeEventListener(dismiss);
			}
			container.addEventListener('click', dismiss);
			var changes = variable.changes;
			changes && changes.forEach(function(change){
				var changeElement = box.appendChild(document.createElement('div'));
				changeElement.textContent = 'Old: ' + valueToString(change.old) + ', new: ' + valueToString(change.new);
				changeElement.onclick = function(){
					console.log('old:', change.old);
					console.log('new:', change['new']);
					console.log('stack:', change.stack);
					box.appendChild(document.createElement('div')).textContent = 'check the console for the stack trace of this event';
				};

			});
		}
		function createVariableBox(text, parent){
			var box = (parent || container).appendChild(document.createElement('div'));
			if(!parent){
				box.style.position = 'absolute';
			}else{
				box.style.margin = '5px';
			}
			box.style.boxShadow = '2px 2px 3px #888';
			box.style.backgroundColor = '#eee';
			box.style.border = '1px solid #888';
			box.style.borderRadius = '3px';
			box.style.padding = '4px';
			box.style.zIndex = 100;
			box.textContent = text;
			return box;
		}
		function processVariable(variable, dependent, parent, key){
			var variableId;
			if(variable.parent){
				processVariable(variable.parent, dependent);
			}
			if(variable.getId){
				variableId = 'variable-' + variable.getId();
			}else{
				variableId = 'subscriber-' + (variable.id || (variable.id = nextId++));
			}
			if(processed[variableId]){
				variableElement = processed[variableId];
				if(variableElement.expand){
					variableElement.expand(true);
				}
				return variableElement;
			}
			var variableElement = createVariableBox('', parent);
			variableElement.to = dependent;
			processed[variableId] = variableElement;
			var triangle = create.triangle(variableElement);
			triangle.style.display = 'inline-block';
			var expanded;
			variableElement.expand = triangle.onclick = function(expand){
				expanded = typeof expand == 'boolean' ? expand : !expanded;
				if(expand.stopPropagation){
					expand.stopPropagation();
				}
				if(expanded){
					childContainer.style.display = 'block';
					triangle.style.transform = 'rotate(90deg)';
				}else{					
					childContainer.style.display = 'none';
					triangle.style.transform = 'rotate(0)';
				}
			};
			var labelNode = create(variableElement, 'span');
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

			variableElement.variable = variable;
			if(!parent){
				newNodes.push(variableElement);
			}

			var childContainer = create(variableElement, 'div');
			if(key){
				childContainer.style.display = 'none';
			}
			for(var childKey in variable._properties){
				processVariable(variable.property(childKey), dependent, childContainer, childKey);
			}
			variableElement.downstream = true;
			var args = variable.args;
			if(args){
				for(var i = 0; i < args.length; i++){
					addConnection(processVariable(args[i], dependent), variableElement, '' + i);
				}
			}
			if(variable.functionVariable){
				addConnection(processVariable(variable.functionVariable, dependent, variableElement), variableElement, 'map');
			}
			if(variable.notifyingValue){
				addConnection(processVariable(variable.notifyingValue, dependent, variableElement), variableElement, 'value');
			}
			return processed[variableId] = variableElement;
		}

		for(var i = 0, l = allElements.length; i < l; i++){
			var element = allElements[i];
			if(element.offsetParent && element.alkaliRenderers){
				var height = element.offsetHeight;
				var width = element.offsetWidth;
				var elementOverlay = create(container, 'div', {
					position: 'absolute',
					left: getAbsoluteX(element) + 'px',
					top: getAbsoluteY(element) + 'px',
					width: width + 'px',
					height: height + 'px',
					backgroundColor: '#00f',
					opacity: 0.2,
					zIndex: 1
				});
				elementOverlay.className = 'element-overlay';
				elementOverlay.nodeId = 'element-' + i;
				elementOverlay.targetElement = element;
			}
		}

		var closeButton = create(container, 'div', {
			position: 'absolute',
			left: (boundX - 60) + 'px',
			top: '20px',
			cursor: 'pointer',
			fontSize: '40px',
			zIndex: 5000,
		});
		closeButton.textContent = 'X';
		closeButton.addEventListener('click', function(){
			document.body.removeChild(container);
		});

		var trackButton = create(container, 'button', {
			position: 'absolute',
			left: (boundX - 200) + 'px',
			top: '20px',
			zIndex: 5000
		});
		trackButton.textContent = 'Track variables';
		trackButton.addEventListener('click', function(){
			instrumentVariables();
		});


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
						var renderers = element.alkaliRenderers;
						for(var j = 0; j < renderers.length; j++){
							var renderer = renderers[j];
							var rendererBox = createVariableBox(fitString('Renderer ' + (renderer.name || '')));

							newNodes.push(rendererBox);
							rendererBox.to = litmusElement;
							addConnection(rendererBox, litmusElement, '');
							addConnection(processVariable(renderer.variable, rendererBox), rendererBox, '');
						}

					}
					graph.layout(newNodes, newEdges);
					newNodes = [];
					newEdges = [];
					return;
				}
				litmusElement = litmusElement.parentNode;
			}
//			cy.layout(configuration.layout);
		});
	};
});