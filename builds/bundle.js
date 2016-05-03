/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(3), __webpack_require__(4), __webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Updater, Variable, graph, create) {
		function getAbsoluteX(element) {
			var rect = element.getBoundingClientRect();
			return rect.left + window.pageXOffset - document.documentElement.clientLeft;
		}
		function getAbsoluteY(element) {
			var rect = element.getBoundingClientRect();
			return rect.top + window.pageYOffset - document.documentElement.clientTop;
		}
		function instrumentVariableClass(Class) {
			var originalPut = Class.prototype.put;
			Class.prototype.put = function (value) {
				(this.changes || (this.changes = [])).push({
					old: this.valueOf(),
					'new': value,
					stack: new Error('Variable change').stack
				});
				return originalPut.apply(this, arguments);
			};
		}
		var instrumented = false;
		function instrumentVariables() {
			if (instrumented) {
				return;
			}
			instrumented = true;
			instrumentVariableClass(Variable);
			instrumentVariableClass(Variable.Property);
			instrumentVariableClass(Variable.Call);
		}
		var container;
		return window.litmus = function (options) {
			var justRefresh = false;
			if (container) {
				container.style.display = 'block';
				justRefresh = true;
			} else {
				container = create(document.body, 'div', {
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
			}

			var boundX = window.innerWidth;
			var boundY = window.innerHeight;
			var allElements = document.documentElement.getElementsByTagName('*');

			for (var i = 0, l = allElements.length; i < l; i++) {
				var element = allElements[i];
				if (element.offsetParent && element.alkaliRenderers) {
					var needsRerendering = element.className.indexOf('needs-rerendering') > -1; // sound the alarm
					var height = element.offsetHeight;
					var width = element.offsetWidth;
					var elementOverlay = create(container, 'div', {
						position: 'absolute',
						left: getAbsoluteX(element) + 'px',
						top: getAbsoluteY(element) + 'px',
						width: width + 'px',
						height: height + 'px',
						backgroundColor: needsRerendering ? '#f00' : '#00f',
						opacity: 0.2,
						zIndex: 1
					});
					elementOverlay.className = 'element-overlay';
					elementOverlay.nodeId = 'element-' + i;
					elementOverlay.targetElement = element;
					if (needsRerendering) {
						alert('An element that was marked as hidden, for deferred rerendering, is visible, and is marked in red. Ensure that Updater.onShowElement is called when any hidden variable-driven element is reshown');
					}
				}
			}
			var closeOverlayButton = create(container, 'div', {
				position: 'absolute',
				left: boundX - 60 + 'px',
				top: '20px',
				cursor: 'pointer',
				fontSize: '40px',
				zIndex: 5000
			});
			closeOverlayButton.textContent = 'X';
			closeOverlayButton.addEventListener('click', function () {
				var oldElementOverlays = document.querySelectorAll('.element-overlay');
				for (var i = 0; i < oldElementOverlays.length; i++) {
					container.removeChild(oldElementOverlays[i]);
				}
				container.removeChild(closeOverlayButton);
			});

			if (justRefresh) {
				return;
			}

			var nextId = 1;
			var nodes = [];
			var newNodes = [];
			var newEdges = [];

			var processed = {};
			function addConnection(source, target, label) {
				if (!source) {
					return;
				}
				var edge = {
					source: source,
					target: target,
					label: label
				};
				newEdges.push(edge);
				return edge;
			}
			function valueToString(value) {
				return fitString('' + value);
			}
			function fitString(string) {
				if (string.length > 20) {
					return string.slice(0, 20) + '...';
				}
				return string;
			}
			function editDialog(element) {
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
				closeButton.addEventListener('click', function () {
					dismiss();
				});
				var title = box.appendChild(document.createElement('div'));
				title.textContent = 'Edit value';
				editArea = box.appendChild(document.createElement('textarea'));
				editArea.style.width = '500px';
				editArea.style.height = '250px';
				var variable = element.variable;
				var value = variable.valueOf();
				try {
					var asSource = typeof value === 'function' ? value.toString() : JSON.stringify(value, null, '\t');
					var ok = box.appendChild(document.createElement('button'));
					ok.style.display = 'block';
					ok.style.margin = '10px';
					ok.innerHTML = 'Save';
					ok.addEventListener('click', function () {
						try {
							variable.put(eval('(' + editArea.value + ')'));
							dismiss();
						} catch (error) {
							alert(error);
						}
					});
				} catch (error) {
					asSource = error;
				}
				editArea.value = asSource;
				function dismiss(event) {
					if (!event || !box.contains(event.target) && container.contains(box)) {
						container.removeChild(box);
					}
					container.removeEventListener(dismiss, false);
				}
				container.addEventListener('click', dismiss);
				var changes = variable.changes;
				changes && changes.forEach(function (change) {
					var changeElement = box.appendChild(document.createElement('div'));
					changeElement.textContent = 'Old: ' + valueToString(change.old) + ', new: ' + valueToString(change.new);
					changeElement.onclick = function () {
						console.log('old:', change.old);
						console.log('new:', change['new']);
						console.log('stack:', change.stack);
						box.appendChild(document.createElement('div')).textContent = 'check the console for the stack trace of this event';
					};
				});
			}
			function createVariableBox(text, parent) {
				var box = create(parent || container, 'div', {
					boxShadow: '2px 2px 3px #888',
					backgroundColor: '#eee',
					border: '1px solid #888',
					borderRadius: '3px',
					padding: '4px',
					paddingRight: '13px',
					zIndex: 100,
					maxHeight: boundY + 'px',
					overflow: 'auto'
				});
				box.isVariable = true;
				box.textContent = text;

				if (!parent) {
					box.style.position = 'absolute';
					box.draggable = true;
					var closeButton = create(box, 'div', {
						position: 'absolute',
						right: '0',
						top: '0',
						cursor: 'pointer',
						fontSize: '10px'
					});
					closeButton.textContent = 'X';
					closeButton.onclick = function (event) {
						event.stopPropagation();
						box.style.display = 'none';
						graph.refresh();
					};
				} else {
					box.style.margin = '5px';
				}

				return box;
			}
			function processVariable(variable, dependent, parent, key, keepClosed) {
				if (!variable || !variable.subscribe) {
					return;
				}
				var variableId;
				if (variable.parent) {
					processVariable(variable.parent, dependent, null, null, key);
				}
				if (variable.getId) {
					variableId = 'variable-' + variable.getId();
				} else {
					variableId = 'subscriber-' + (variable.id || (variable.id = nextId++));
				}
				if (processed[variableId]) {
					variableElement = processed[variableId];
					variableElement.style.display = 'block';
					if (variableElement.expand && !keepClosed) {
						variableElement.expand(true);
					}
					return variableElement;
				}
				var variableElement = createVariableBox('', parent);
				variableElement.to = dependent;
				processed[variableId] = variableElement;
				if (variable._properties) {
					var triangle = create.triangle(variableElement, 6);
					triangle.style.display = 'inline-block';
					var expanded;
					variableElement.expand = triangle.onclick = function (expand) {
						expanded = typeof expand == 'boolean' ? expand : !expanded;
						if (expand.stopPropagation) {
							expand.stopPropagation();
						}
						if (expanded) {
							childContainer.style.display = 'block';
							triangle.style.transform = 'rotate(90deg)';
						} else {
							childContainer.style.display = 'none';
							triangle.style.transform = 'rotate(0)';
						}
						graph.refresh();
					};
				}
				var labelNode = create(variableElement, 'span');
				labelNode.textContent = 'undefined';
				if (key) {
					labelNode.textContent = key + ':';
				}
				new Updater.ElementUpdater({
					element: labelNode,
					variable: variable,
					renderUpdate: function renderUpdate(newValue) {
						var label = '' + newValue;
						if (key) {
							label = key + ': ' + label;
						}
						labelNode.textContent = fitString(label);
					}
				});

				variableElement.variable = variable;
				if (!parent) {
					newNodes.push(variableElement);
				}

				var childContainer = create(variableElement, 'div');
				if (key || keepClosed) {
					childContainer.style.display = 'none';
				}
				for (var childKey in variable._properties) {
					processVariable(variable.property(childKey), dependent, childContainer, childKey);
				}
				variableElement.downstream = true;
				var args = variable.args;
				if (args) {
					for (var i = 0; i < args.length; i++) {
						addConnection(processVariable(args[i], dependent), variableElement, '' + i);
					}
				}
				if (variable.copiedFrom) {
					addConnection(processVariable(variable.copiedFrom, dependent), variableElement, 'copied from');
				}
				if (variable.functionVariable) {
					processVariable(variable.functionVariable, dependent, variableElement);
				}
				if (variable.notifyingValue) {
					var previousNotifyingValue;
					new Updater({
						variable: variable,
						element: document.body,
						update: function update() {
							if (previousNotifyingValue) {
								graph.removeEdge(previousNotifyingValue);
							}
							previousNotifyingValue = addConnection(processVariable(variable.notifyingValue, dependent), variableElement, 'value');
						}
					});
				}
				return processed[variableId] = variableElement;
			}

			var hideEverythingButton = create(container, 'div', {
				position: 'absolute',
				left: boundX - 60 + 'px',
				top: '20px',
				cursor: 'pointer',
				fontSize: '40px',
				zIndex: 4000
			});
			hideEverythingButton.textContent = 'X';
			hideEverythingButton.addEventListener('click', function () {
				container.style.display = 'none';
			});

			var trackButton = create(container, 'button', {
				position: 'absolute',
				left: boundX - 200 + 'px',
				top: '20px',
				zIndex: 5000
			});
			trackButton.textContent = 'Track variables';
			trackButton.addEventListener('click', function () {
				instrumentVariables();
			});
			var draggedVariable, offsetX, offsetY;
			container.addEventListener('dragstart', function (event) {
				draggedVariable = event.target;
				draggedVariable = draggedVariable.isVariable && draggedVariable;
				if (draggedVariable) {
					offsetX = draggedVariable.offsetLeft - event.clientX;
					offsetY = draggedVariable.offsetTop - event.clientY;
				}
			});
			document.body.addEventListener('dragover', function (event) {
				event.preventDefault();
				event.dataTransfer.dropEffect = 'move';
			});
			document.body.addEventListener('drop', function (event) {
				if (draggedVariable) {
					draggedVariable.style.left = event.clientX + offsetX + 'px';
					draggedVariable.style.top = event.clientY + offsetY + 'px';
					graph.refresh();
				}
			});

			container.addEventListener('click', function (event) {
				var litmusElement = event.target;
				while (litmusElement) {
					if (litmusElement == container) {
						return;
					}
					if (litmusElement.variable) {
						editDialog(litmusElement);
						return;
					}
					if (litmusElement.renderer) {
						alert(litmusElement.renderer.renderUpdate);
						return;
					}
					if (litmusElement.targetElement) {
						var element = litmusElement.targetElement;
						if (element) {
							var id = event.target.nodeId;
							var renderers = element.alkaliRenderers;
							for (var j = 0; j < renderers.length; j++) {
								var renderer = renderers[j];
								var rendererId = 'renderer' + renderer.getId();
								if (processed[rendererId]) {
									processed[rendererId].style.display = 'block';
								} else {
									var rendererBox = createVariableBox(fitString((renderer.type || 'Renderer') + ' ' + (renderer.name || '')));
									processed[rendererId] = rendererBox;
									rendererBox.renderer = renderer;
									newNodes.push(rendererBox);
									rendererBox.to = litmusElement;
									addConnection(rendererBox, litmusElement, '');
									addConnection(processVariable(renderer.variable, rendererBox), rendererBox, '');
								}
							}
						}
						graph.layout(newNodes, newEdges);
						newNodes = [];
						newEdges = [];
						return;
					}
					litmusElement = litmusElement.parentNode;
				}
				//			cy.layout(configuration.layout)
			});
		};
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./util/lang'))
	    } else {
	        root.alkali.Updater = factory(root.alkali.lang)
	    }
	}(this, function (lang, Variable) {
		var doc = typeof document !== 'undefined' && document
		var invalidatedElements
		var queued
		var toRender = []
		var nextId = 1
		var requestAnimationFrame = lang.requestAnimationFrame

		function Context(subject){
			this.subject = subject
		}

		function Updater(options) {
			var variable = options.variable

			this.variable = variable
			this.elements = []
			if (options) {
				if (options.selector) {
					this.selector = options.selector
				}
				if (options.elements) {
					this.elements = options.elements
					this.element = this.elements[0]
				}
				if (options.element) {
					this.element = options.element
					this.elements.push(options.element)
				}
				for(var i = 0, l = this.elements.length; i < l; i++) {
					(this.elements[i].alkaliRenderers || (this.elements[i].alkaliRenderers = [])).push(this)
				}
				if (options.update) {
					this.updateRendering = options.update
				}
				if (options.shouldRender) {
					this.shouldRender = options.shouldRender
				}
				if (options.renderUpdate) {
					this.renderUpdate = options.renderUpdate
				}
				if (options.alwaysUpdate) {
					this.alwaysUpdate = options.alwaysUpdate
				}
			}
			if (variable.updated) {
				// if it has update, we don't need to instantiate a closure
				variable.notifies(this)
			} else {
				// baconjs-esqe API
				var updater = this
				variable.subscribe(function (event) {
					// replace the variable with an object
					// that returns the value from the event
					updater.variable = {
						valueOf: function () {
							return event.value()
						}
					}
					updater.updated()
				})
			}
			if(options && options.updateOnStart !== false){
				this.updateRendering(true)
			}
		}
		Updater.prototype = {
			constructor: Updater,
			updateRendering: function () {
				throw new Error ('updateRendering must be implemented by sub class of Updater')
			},
			updated: function (updateEvent, by, context) {
				if (!this.invalidated) {
					if (!context || this.contextMatches(context)) {
						// do this only once, until we render again
						this.invalidated = true
						var updater = this
						requestAnimationFrame(function(){
							invalidatedElements = null
							updater.updateRendering(updater.alwaysUpdate)
						})
					}
				}
			},
			contextMatches: function(context) {
				return true
				return context == this.elements ||
					// if context is any element in this.elements - perhaps return only the specific matching elements?
					(this.elements.indexOf(context) != -1) ||
				  // (context is an array and any/all elements are contained in this.elements) ||
					// context contains() any of this.elements
					(function(elements) {
						for(var i = 0, l = elements.length; i < l; i++) {
							if (context.contains(elements[i])) return true
						}
						return false
					})(this.elements)
			},
			invalidateElement: function(element) {
				if(!invalidatedElements){
					invalidatedElements = new WeakMap(null, 'invalidated')
					// TODO: if this is not a real weak map, we don't want to GC it, or it will leak
				}
				var invalidatedParts = invalidatedElements.get(element)
				invalidatedElements.set(element, invalidatedParts = {})
				if (!invalidatedParts[id]) {
					invalidatedParts[id] = true
				}
				if (!queued) {
					lang.queueTask(processQueue)
					queued = true
				}
				var updater = this
				toRender.push(function(){
					updater.invalidated = false
					updater.updateElement(element)
				})
			},
			getId: function(){
				return this.id || (this.id = nextId++)
			},
			stop: function() {
				this.variable.stopNotifies(this)
			}

		}

		function ElementUpdater(options) {
			Updater.call(this, options)
		}
		ElementUpdater.prototype = Object.create(Updater.prototype)
		ElementUpdater.prototype.shouldRender = function (element) {
			return document.body.contains(element)
		}
		ElementUpdater.prototype.getSubject = function () {
			return this.element || this.elements[0]
		}
		ElementUpdater.prototype.updateRendering = function (always, element) {
			var elements = this.elements || (element && [element]) || []
			if(!elements.length){
				if(this.selector){
					elements = document.querySelectorAll(this.selector)
				}else{
					throw new Error('No element or selector was provided to the Updater')
				}
				return
			}
			for(var i = 0, l = elements.length; i < l; i++){
				if(always || this.shouldRender(elements[i])){
					// it is connected
					this.updateElement(elements[i])
				}else{
					var id = this.getId()
					var updaters = elements[i].updatersOnShow
					if(!updaters){
						updaters = elements[i].updatersOnShow = []
						elements[i].className += ' needs-rerendering'
					}
					if (!updaters[id]) {
						updaters[id] = this
					}
				}
			}
		}
		ElementUpdater.prototype.addElement = function (element) {
			if (this.selector) {
				element.updatersOnShow = [this]
			} else {
				this.elements.push(element)
			}
			// and immediately do an update
			this.updateElement(element)
		}
		ElementUpdater.prototype.updateElement = function(element) {
			this.invalidated = false
			try {
				// TODO: might make something cheaper than for(element) for setting context?
				var value = !this.omitValueOf && this.variable.valueOf(new Context(element))
			} catch (error) {
				element.appendChild(document.createTextNode(error))
			}
			if(value !== undefined || this.started){
				this.started = true
				if(value && value.then){
					if(this.renderLoading){
						this.renderLoading(value, element)
					}
					var updater = this
					value.then(function (value) {
						updater.renderUpdate(value, element)
					})
				}else{
					this.renderUpdate(value, element)
				}
			}
		}
		ElementUpdater.prototype.renderUpdate = function (newValue, element) {
			throw new Error('renderUpdate(newValue) must be implemented')
		}
		Updater.Updater = Updater
		Updater.ElementUpdater = ElementUpdater

		function AttributeUpdater(options) {
			if(options.name){
				this.name = options.name
			}
			ElementUpdater.apply(this, arguments)
		}
		AttributeUpdater.prototype = Object.create(ElementUpdater.prototype)
		AttributeUpdater.prototype.type = 'AttributeUpdater'
		AttributeUpdater.prototype.renderUpdate = function (newValue, element) {
			element.setAttribute(this.name, newValue)
		}
		Updater.AttributeUpdater = AttributeUpdater

		function PropertyUpdater(options) {
			if(options.name){
				this.name = options.name
			}
			ElementUpdater.apply(this, arguments)
		}
		PropertyUpdater.prototype = Object.create(ElementUpdater.prototype)
		PropertyUpdater.prototype.type = 'PropertyUpdater'
		PropertyUpdater.prototype.renderUpdate = function (newValue, element) {
			element[this.name] = newValue
		}
		Updater.PropertyUpdater = PropertyUpdater

		function StyleUpdater(options) {
			if(options.name){
				this.name = options.name
			}
			ElementUpdater.apply(this, arguments)
		}
		StyleUpdater.prototype = Object.create(ElementUpdater.prototype)
		StyleUpdater.prototype.type = 'StyleUpdater'
		StyleUpdater.prototype.renderUpdate = function (newValue, element) {
			element.style[this.name] = newValue
		}
		Updater.StyleUpdater = StyleUpdater

		function ContentUpdater(options) {
			ElementUpdater.apply(this, arguments)
		}
		ContentUpdater.prototype = Object.create(ElementUpdater.prototype)
		ContentUpdater.prototype.type = 'ContentUpdater'
		ContentUpdater.prototype.renderUpdate = function (newValue, element) {
			element.innerHTML = ''
			if (newValue === undefined){
				newValue = ''
			}
			element.appendChild(document.createTextNode(newValue))
		}
		Updater.ContentUpdater = ContentUpdater

		function TextUpdater(options) {
			this.position = options.position
			this.textNode = options.textNode
			ElementUpdater.apply(this, arguments)
		}
		TextUpdater.prototype = Object.create(ElementUpdater.prototype)
		TextUpdater.prototype.type = 'TextUpdater'
		TextUpdater.prototype.renderUpdate = function (newValue, element) {
			if (newValue === undefined){
				newValue = ''
			}
			(this.textNode || element.childNodes[this.position]).nodeValue = newValue
		}
		Updater.TextUpdater = TextUpdater

		function ListUpdater(options) {
			if (options.each) {
				this.each = options.each
			}
			ElementUpdater.apply(this, arguments)
		}
		ListUpdater.prototype = Object.create(ElementUpdater.prototype)
		ListUpdater.prototype.updated = function (updateEvent, context) {
			(this.updates || (this.updates = [])).push(updateEvent)
			ElementUpdater.prototype.updated.call(this, updateEvent, context)
		}
		ListUpdater.prototype.type = 'ListUpdater'
		ListUpdater.prototype.omitValueOf = true
		ListUpdater.prototype.renderUpdate = function (newValue, element) {
			var container
			var each = this.each
			var thisElement = this.elements[0]
			var updater = this
			if (!this.builtList) {
				this.builtList = true
				container = document.createDocumentFragment()
				var childElements = this.childElements = []
				this.variable.for(thisElement).forEach(function(item) {
					eachItem(item)
				})
				this.element.appendChild(container)
			} else {
				var childElements = this.childElements
				var updates = this.updates
				container = this.element
				updates.forEach(function(update) {
					if (update.type === 'refresh') {
						updater.builtList = false
						for (var i = 0, l = childElements.length; i < l; i++) {
							thisElement.removeChild(childElements[i])
						}
						updater.renderUpdate()
					} else {
						if (update.previousIndex > -1) {
							thisElement.removeChild(childElements[update.previousIndex])
							childElements.splice(update.previousIndex, 1)
						}
						if (update.index > -1) {
							var nextChild = childElements[update.index] || null
							eachItem(update.value, update.index, nextChild)
						}
					}
				})
				this.updates = [] // clear the updates
			}
			function eachItem(item, index, nextChild) {
				var childElement
				if (each.create) {
					childElement = each.create({parent: thisElement, _item: item}) // TODO: make a faster object here potentially
				} else {
					childElement = each(item, thisElement)
				}
				if (nextChild) {
					container.insertBefore(childElement, nextChild)
					childElements.splice(index, 0, childElement)
				} else {
					container.appendChild(childElement)
					childElements.push(childElement)
				}
			}
		}
		Updater.ListUpdater = ListUpdater

		Updater.onShowElement = function(shownElement){
			requestAnimationFrame(function(){
				invalidatedElements = null
				var elements = [].slice.call(shownElement.getElementsByClassName('needs-rerendering'))
				if (shownElement.className.indexOf('needs-rerendering') > 0){
					var includingTop = [shownElement]
					includingTop.push.apply(includingTop, elements)
					elements = includingTop
				}
				for (var i = 0, l = elements.length; i < l; i++){
					var element = elements[i]
					var updaters = element.updatersOnShow
					if(updaters){
						element.updatersOnShow = null
						// remove needs-rerendering class
						element.className = element.className.replace(/\s?needs\-rerendering\s?/g, '')
						for (var id in updaters) {
							var updater = updaters[id]
							updater.updateElement(element)
						}
					}
				}
			})
		}

		function onElementRemoval(element){
			// cleanup element renderers
			if(element.alkaliRenderers){
				var renderers = element.alkaliRenderers
				for(var i = 0; i < renderers.length; i++){
					var renderer = renderers[i]
					renderer.variable.stopNotifies(renderer)
				}
			}
		}
		Updater.onElementRemoval = function(element, onlyChildren){
			if(!onlyChildren){
				onElementRemoval(element)
			}
			var children = element.getElementsByTagName('*')
			for(var i = 0, l = children.length; i < l; i++){
				var child = children[i]
				if(child.alkaliRenderers){
					onElementRemoval(child)
				}
			}
		}
		return Updater
	}));

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory()
	    } else {
	        root.alkali = {lang: factory()}
	    }
	}(this, function () {
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var hasFeatures = {
			requestAnimationFrame: typeof requestAnimationFrame != 'undefined',
			defineProperty: Object.defineProperty && (function(){
				try{
					Object.defineProperty({}, 't', {})
					return true
				}catch(e){
				}
			})(),
			promise: typeof Promise !== 'undefined',
			'WeakMap': typeof WeakMap === 'function'
		}
		function has(feature){
			return hasFeatures[feature]
		}
		// This is an polyfill for Object.observe with just enough functionality
		// for what Variables need
		// An observe function, with polyfile
		var observe =
			has('defineProperty') ? 
			function observe(target, listener){
				/*for(var i in target){
					addKey(i)
				}*/
				listener.addKey = addKey
				listener.remove = function(){
					listener = null
				}
				return listener
				function addKey(key){
					var keyFlag = 'key' + key
					if(this[keyFlag]){
						return
					}else{
						this[keyFlag] = true
					}
					var currentValue = target[key]
					var targetAncestor = target
					var descriptor
					do {
						descriptor = Object.getOwnPropertyDescriptor(targetAncestor, key)
					} while(!descriptor && (targetAncestor = getPrototypeOf(targetAncestor)))

					if(descriptor && descriptor.set){
						var previousSet = descriptor.set
						var previousGet = descriptor.get
						Object.defineProperty(target, key, {
							get: function(){
								return (currentValue = previousGet.call(this))
							},
							set: function(value){
								previousSet.call(this, value)
								if(currentValue !== value){
									currentValue = value
									if(listener){
										listener([{target: this, name: key}])
									}
								}
							},
							enumerable: descriptor.enumerable
						})
					}else{
						Object.defineProperty(target, key, {
							get: function(){
								return currentValue
							},
							set: function(value){
								if(currentValue !== value){
									currentValue = value
									if(listener){
										listener([{target: this, name: key}])
									}
								}
							},
							enumerable: !descriptor || descriptor.enumerable
						})
					}
				}
			} :
			// and finally a polling-based solution, for the really old browsers
			function(target, listener){
				if(!timerStarted){
					timerStarted = true
					setInterval(function(){
						for(var i = 0, l = watchedObjects.length; i < l; i++){
							diff(watchedCopies[i], watchedObjects[i], listeners[i])
						}
					}, 20)
				}
				var copy = {}
				for(var i in target){
					if(target.hasOwnProperty(i)){
						copy[i] = target[i]
					}
				}
				watchedObjects.push(target)
				watchedCopies.push(copy)
				listeners.push(listener)
			}
		var queuedListeners
		function queue(listener, object, name){
			if(queuedListeners){
				if(queuedListeners.indexOf(listener) === -1){
					queuedListeners.push(listener)
				}
			}else{
				queuedListeners = [listener]
				lang.nextTurn(function(){
					queuedListeners.forEach(function(listener){
						var events = []
						listener.properties.forEach(function(property){
							events.push({target: listener.object, name: property})
						})
						listener(events)
						listener.object = null
						listener.properties = null
					})
					queuedListeners = null
				}, 0)
			}
			listener.object = object
			var properties = listener.properties || (listener.properties = [])
			if(properties.indexOf(name) === -1){
				properties.push(name)
			}
		}
		var unobserve = has('observe') ? Object.unobserve :
			function(target, listener){
				if(listener.remove){
					listener.remove()
				}
				for(var i = 0, l = watchedObjects.length; i < l; i++){
					if(watchedObjects[i] === target && listeners[i] === listener){
						watchedObjects.splice(i, 1)
						watchedCopies.splice(i, 1)
						listeners.splice(i, 1)
						return
					}
				}
			}
		var watchedObjects = []
		var watchedCopies = []
		var listeners = []
		var timerStarted = false
		function diff(previous, current, callback){
			// TODO: keep an array of properties for each watch for faster iteration
			var queued
			for(var i in previous){
				if(previous.hasOwnProperty(i) && previous[i] !== current[i]){
					// a property has changed
					previous[i] = current[i]
					(queued || (queued = [])).push({name: i})
				}
			}
			for(var i in current){
				if(current.hasOwnProperty(i) && !previous.hasOwnProperty(i)){
					// a property has been added
					previous[i] = current[i]
					(queued || (queued = [])).push({name: i})
				}
			}
			if(queued){
				callback(queued)
			}
		}

		var id = 1
		// a function that returns a function, to stop JSON serialization of an
		// object
		function toJSONHidden() {
			return toJSONHidden
		}
		// An object that will be hidden from JSON serialization
		var Hidden = function () {
		}
		Hidden.prototype.toJSON = toJSONHidden

		var lang = {
			requestAnimationFrame: has('requestAnimationFrame') ? requestAnimationFrame :
				(function(){
					var toRender = []
					var queued = false
					function processAnimationFrame() {
						for (var i = 0; i < toRender.length; i++){
							toRender[i]()
						}
						toRender = []
						queued = false
					}
					function requestAnimationFrame(renderer){
					 	if (!queued) {
							setTimeout(processAnimationFrame)
							queued = true
						}
						toRender.push(renderer)
					}
					return requestAnimationFrame
				})(),
			Promise: has('promise') ? Promise : (function(){
				function Promise(execute){
					var isResolved, resolution, errorResolution
					var queue = 0
					function resolve(value){
						// resolve function
						if(value && value.then){
							// received a promise, wait for it
							value.then(resolve, reject)
						}else{
							resolution = value
							finished()
						}
					}
					function reject(error){
						// reject function
						errorResolution = error
						finished()
					}
					execute(resolve, reject)
					function finished(){
						isResolved = true
						for(var i = 0, l = queue.length; i < l; i++){
							queue[i]()
						}
						// clean out the memory
						queue = 0
					}
					return {
						then: function(callback, errback){
							return new Promise(function(resolve, reject){
								function handle(){
									// promise fulfilled, call the appropriate callback
									try{
										if(errorResolution && !errback){
											// errors without a handler flow through
											reject(errorResolution)
										}else{
											// resolve to the callback's result
											resolve(errorResolution ?
												errback(errorResolution) :
												callback ?
													callback(resolution) : resolution)
										}
									}catch(newError){
										// caught an error, reject the returned promise
										reject(newError)
									}
								}
								if(isResolved){
									// already resolved, immediately handle
									handle()
								}else{
									(queue || (queue = [])).push(handle)
								}
							})
						}
					}
				}
				return Promise
			}()),

			WeakMap: has('WeakMap') ? WeakMap :
		 	function (values, name) {
		 		var mapProperty = '__' + (name || '') + id++
		 		return has('defineProperty') ?
		 		{
		 			get: function (key) {
		 				return key[mapProperty]
		 			},
		 			set: function (key, value) {
		 				Object.defineProperty(key, mapProperty, {
		 					value: value,
		 					enumerable: false
		 				})
		 			}
		 		} :
		 		{
		 			get: function (key) {
		 				var intermediary = key[mapProperty]
		 				return intermediary && intermediary.value
		 			},
		 			set: function (key, value) {
		 				// we use an intermediary that is hidden from JSON serialization, at least
		 				var intermediary = key[mapProperty] || (key[mapProperty] = new Hidden())
		 				intermediary.value = value
		 			}
		 		}
		 	},

			observe: observe,
			unobserve: unobserve,
			when: function(value, callback, errorHandler){
				return value && value.then ?
					(value.then(callback, errorHandler) || value) : callback(value)
			},
			whenAll: function(inputs, callback){
				var promiseInvolved
				for(var i = 0, l = inputs.length; i < l; i++){
					if(inputs[i] && inputs[i].then){
						promiseInvolved = true
					}
				}
				if(promiseInvolved){
					// we have asynch inputs, do lazy loading
					return {
						then: function(onResolve, onError){
							var remaining = 1
							var result
							var readyInputs = []
							var lastPromiseResult
							for(var i = 0; i < inputs.length; i++){
								var input = inputs[i]
								remaining++
								if(input && input.then){
									(function(i, previousPromiseResult){
										lastPromiseResult = input.then(function(value){
											readyInputs[i] = value
											onEach()
											if(!remaining){
												return result
											}else{
												return previousPromiseResult
											}
										}, onError)
									})(i, lastPromiseResult)
								}else{
									readyInputs[i] = input
									onEach()
								}
							}
							onEach()
							function onEach(){
								remaining--
								if(!remaining){
									result = onResolve(callback(readyInputs))
								}
							}
							return lastPromiseResult
						},
						inputs: inputs
					}
				}
				// just sync inputs
				return callback(inputs)

			},
			compose: function(Base, constructor, properties){
				var prototype = constructor.prototype = Object.create(Base.prototype)
				setPrototypeOf(constructor, Base)
				for(var i in properties){
					prototype[i] = properties[i]
				}
				prototype.constructor = constructor
				return constructor
			},
			nextTurn: has('promise') ? 
				function (callback) {
					// promises resolve on the next micro turn
					new Promise(function (resolve) {
						resolve(); 
					}).then(callback)
				} :
				function (callback) {
					// TODO: we can do better for other, older browsers
					setTimeout(callback, 0)
				},
			copy: Object.assign || function(target, source){
				for(var i in source){
					target[i] = source[i]
				}
				return target
			}
		}
		return lang
	}));

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./util/lang'))
	    } else {
	        root.alkali.Variable = factory(root.alkali.lang)
	    }
	}(this, function (lang) {
		var deny = {}
		var noChange = {}
		var WeakMap = lang.WeakMap
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		// update types
		var ToParent = 2
		var RequestChange = 3
		var Refresh = Object.freeze({
			type: 'refresh'
		})
		var ToChild = Object.freeze({
			type: 'refresh'
		})
		var nextId = 1
		var propertyListenersMap = new WeakMap(null, 'propertyListenersMap')

		var CacheEntry = lang.compose(WeakMap, function() {
		},{
			_propertyChange: function(propertyName) {
				this.variable._propertyChange(propertyName, contextFromCache(this))
			}
		})
		var listenerId = 1

		function mergeSubject(context) {
			for (var i = 1, l = arguments.length; i < l; i++) {
				var nextContext = arguments[i]
				if (nextContext !== context && (!context || nextContext && context.contains && context.contains(nextContext))) {
					context = nextContext
				}
			}
			return context
		}

		function getDistinctContextualized(variable, context) {
			var subject = context && (context.distinctSubject || context.subject)
			if (typeof variable === 'function') {
				return variable.for(subject)
			}
			var contextMap = variable.contextMap
			if (context && contextMap) {
				while(subject && !contextMap.has(subject)) {
					subject = subject.parentNode
				}
				if (!subject) {
					subject = defaultContext
				}
				return contextMap.get(subject)
			}
		}
		function when(value, callback) {
			if (value && value.then) {
				return value.then(callback)
			}
			return callback(value)
		}

		function Context(subject){
			this.subject = subject
		}
		function whenAll(inputs, callback){
			var promiseInvolved
			var needsContext
			for (var i = 0, l = inputs.length; i < l; i++) {
				if (inputs[i] && inputs[i].then) {
					promiseInvolved = true
				}
			}
			if (promiseInvolved) {
				return lang.whenAll(inputs, callback)
			}
			return callback(inputs)
		}

		function registerListener(value, listener) {
			var listeners = propertyListenersMap.get(value)
			var id = listener.listenerId || (listener.listenerId = ('-' + listenerId++))
			if (listeners) {
				if (listeners[id] === undefined) {
					listeners[id] = listeners.push(listener) - 1
				}
			}else{
				propertyListenersMap.set(value, listeners = [listener])
				listeners[id] = 0
				if (Variable.autoObserveObjects) {
					observe(value)
				}
			}
			listener.listeningToObject = value
		}
		function deregisterListener(listener) {
			if (listener.listeningToObject) {
				var value = listener.listeningToObject
				listener.listeningToObject = null
				var listeners = propertyListenersMap.get(value)
				if (listeners) {
					var index = listeners[listener.listenerId]
					if (index > -1) {
						listeners.splice(index, 1)
						delete listeners[listener.listenerId]
					}
				}
			}
		}

		function PropertyChange(key, object, childEvent) {
			this.key = key
			this.object = object
			this.childEvent = childEvent
			this.version = nextId++
		}
		PropertyChange.prototype.type = 'update'
		function Variable(value) {
			if (this instanceof Variable) {
				// new call, may eventually use new.target
				this.value = typeof value === 'undefined' ? this.default : value
			} else {
				return Variable.extend(value)
			}
		}
		Variable.prototype = {
			constructor: Variable,
			valueOf: function(context) {
				if (this.subject) {
					var variable = this
					context = new Context(this.subject)
				}
				return this.gotValue(this.getValue(context), context)
			},
			getValue: function() {
				return this.value
			},
			gotValue: function(value, context) {
				var previousNotifyingValue = this.notifyingValue
				var variable = this
				if (value && value.then) {
					return when(value, function(value) {
						return Variable.prototype.gotValue.call(variable, value, context)
					})
				}
				if (previousNotifyingValue) {
					if (value === previousNotifyingValue) {
						// nothing changed, immediately return valueOf
						var resolvedValue = value.valueOf()
						if (resolvedValue !== this.listeningToObject) {
							if (this.listeningToObject) {
								deregisterListener(this)
							}
							if (typeof resolvedValue === 'object' && resolvedValue && (this.dependents || this.constructor.dependents)) {
								// set up the listeners tracking
								registerListener(resolvedValue, this)
							}
						}
						return resolvedValue
					}
					// if there was a another value that we were dependent on before, stop listening to it
					// TODO: we may want to consider doing cleanup after the next rendering turn
					if (variable.dependents) {
						previousNotifyingValue.stopNotifies(variable)
					}
					variable.notifyingValue = null
				}
				if (value && value.notifies) {
					if (variable.dependents) {
							// the value is another variable, start receiving notifications
						value.notifies(variable)
					}
					variable.notifyingValue = value
					value = value.valueOf(context)
				}
				if (typeof value === 'object' && value && (this.dependents || this.constructor.dependents)) {
					// set up the listeners tracking
					registerListener(value, this)
				}
				if (value === undefined) {
					value = variable.default
				}
				return value
			},
			isMap: function() {
				return this.value instanceof Map
			},
			property: function(key) {
				var isMap = this.isMap()
				var properties = this._properties || (this._properties = isMap ? new Map() : {})
				var propertyVariable = isMap ? properties.get(key) : properties[key]
				if (!propertyVariable) {
					// create the property variable
					propertyVariable = new Property(this, key)
					if (isMap) {
						properties.set(key, propertyVariable)
					} else {
						properties[key] = propertyVariable
					}
				}
				return propertyVariable
			},
			for: function(subject) {
				if (subject && subject.target && !subject.getForClass) {
					// makes HTML events work
					subject = subject.target
				}
				if (typeof this === 'function') {
					// this is a class, the subject should hopefully have an entry
					if (subject) {
						var instance = subject.getForClass(this)
						if (instance && !instance.subject) {
							instance.subject = subject
						}
						// TODO: Do we have a global context that we set on defaultInstance?
						return instance || this.defaultInstance
					} else {
						return this.defaultInstance
					}
				}
				return new ContextualizedVariable(this, subject || defaultContext)
			},
			distinctFor: function(subject) {
				if (typeof this === 'function') {
					return this.for(subject)
				}
				var map = this.contextMap || (this.contextMap = new WeakMap())
				if (map.has(subject)) {
					return map.get(subject)
				}
				var contextualizedVariable
				map.set(subject, contextualizedVariable = new ContextualizedVariable(this, subject))
				return contextualizedVariable
			},
			_propertyChange: function(propertyName, object, context, type) {
				if (this.onPropertyChange) {
					this.onPropertyChange(propertyName, object, context)
				}
				var properties = this._properties
				var property = properties && (properties instanceof Map ? properties.get(propertyName) : properties[propertyName])
				if (property && !(type instanceof PropertyChange) && object === this.valueOf(context)) {
					property.parentUpdated(ToChild, context)
				}
				this.updated(new PropertyChange(propertyName, object, type), null, context)
			},
			eachKey: function(callback) {
				for (var i in this._properties) {
					callback(i)
				}
			},
			apply: function(instance, args) {
				return new Call(this, args)
			},
			call: function(instance) {
				return this.apply(instance, Array.prototype.slice.call(arguments, 1))
			},
			forDependencies: function(callback) {
				if (this.notifyingValue) {
					callback(this.notifyingValue)
				}
			},
			init: function() {
				if (this.subject) {
					this.constructor.notifies(this)
				}
				var variable = this
				this.forDependencies(function(dependency) {
					dependency.notifies(variable)
				})
			},
			cleanup: function() {
				var handles = this.handles
				if (handles) {
					for (var i = 0; i < handles.length; i++) {
						handles[i].remove()
					}
				}
				this.handles = null
				deregisterListener(this)
				var notifyingValue = this.notifyingValue
				if (notifyingValue) {
					// TODO: move this into the caching class
					this.computedVariable = null
				}
				var variable = this
				this.forDependencies(function(dependency) {
					dependency.stopNotifies(variable)
				})
				if (this.context) {
					this.constructor.stopNotifies(this)
				}
			},

			updateVersion: function() {
				this.version = nextId++
			},

			getVersion: function(context) {
				return Math.max(this.version || 0, this.notifyingValue && this.notifyingValue.getVersion ? this.notifyingValue.getVersion(context) : 0)
			},

			getSubject: function(selectVariable) {
				return this.subject
			},

			getUpdates: function(since) {
				var updates = []
				var nextUpdateMap = this.nextUpdateMap
				if (nextUpdateMap && since) {
					while ((since = nextUpdateMap.get(since))) {
						if (since === Refresh) {
							// if it was refresh, we can clear any prior entries
							updates = []
						}
						updates.push(since)
					}
				}
				return updates
			},

			updated: function(updateEvent, by, context) {
				if (this.subject) {
					if (by === this.constructor) {
						// if we receive an update from the constructor, filter it
						if (!(!context || context.subject === this.subject || (context.subject.contains && this.subject.nodeType && context.subject.contains(this.subject)))) {
							return
						}
					} else {
						// if we receive an outside update, send it to the constructor
						return this.constructor.updated(updateEvent, this, new Context(this.subject))
					}
				}
				if (this.lastUpdate) {
					var nextUpdateMap = this.nextUpdateMap
					if (!nextUpdateMap) {
						nextUpdateMap = this.nextUpdateMap = new WeakMap()
					}
					nextUpdateMap.set(this.lastUpdate, updateEvent)
				}

				this.lastUpdate = updateEvent
				this.updateVersion()
				var value = this.value
				if (!(updateEvent instanceof PropertyChange)) {
					deregisterListener(this)
				}

				var dependents = this.dependents
				if (dependents) {
					// make a copy, in case they change
					dependents = dependents.slice(0)
					for (var i = 0, l = dependents.length; i < l; i++) {
						try{
							var dependent = dependents[i]
							// skip notifying property dependents if we are headed up the parent chain
							if (!(updateEvent instanceof PropertyChange) ||
									dependent.parent !== this || // if it is not a child property
									(by && by.constructor === this)) { // if it is coming from a child context
								if (dependent.parent === this) {
									dependent.parentUpdated(ToChild, context)
								} else {
									dependent.updated(updateEvent, this, context)
								}
							}
						}catch(e) {
							console.error(e, e.stack, 'updating a variable')
						}
					}
				}
			},

			invalidate: function() {
				// for back-compatibility for now
				this.updated()
			},

			notifies: function(target) {
				var dependents = this.dependents
				if (!dependents || !this.hasOwnProperty('dependents')) {
					this.init()
					this.dependents = dependents = []
				}
				dependents.push(target)
				var variable = this
				return {
					unsubscribe: function() {
						variable.stopNotifies(target)
					}
				}
			},
			subscribe: function(listener) {
				// ES7 Observable (and baconjs) compatible API
				var updated
				var variable = this
				// it is important to make sure you register for notifications before getting the value
				if (typeof listener === 'function') {
					// BaconJS compatible API
					var variable = this
					var event = {
						value: function() {
							return variable.valueOf()
						}
					}
					updated = function() {
						listener(event)
					}
				}	else if (listener.next) {
					// Assuming ES7 Observable API. It is actually a streaming API, this pretty much violates all principles of reactivity, but we will support it
					updated = function() {
						listener.next(variable.valueOf())
					}
				} else {
					throw new Error('Subscribing to an invalid listener, the listener must be a function, or have an update or next method')
				}

				var handle = this.notifies({
					updated: updated
				})
				var initialValue = this.valueOf()
				if (initialValue !== undefined) {
					updated()
				}
				return handle
			},
			stopNotifies: function(dependent) {
				var dependents = this.dependents
				if (dependents) {
					for (var i = 0; i < dependents.length; i++) {
						if (dependents[i] === dependent) {
							dependents.splice(i--, 1)
						}
					}
					if (dependents.length === 0) {
						// clear the dependents so it will be reinitialized if it has
						// dependents again
						this.dependents = dependents = false
						this.cleanup()
					}
				}
			},
			put: function(value, context) {
				var variable = this
				
				return when(this.getValue(context), function(oldValue) {
					if (oldValue === value) {
						return noChange
					}
					if (variable.fixed &&
							// if it is set to fixed, we see we can put in the current variable
							oldValue && oldValue.put && // if we currently have a variable
							// and it is always fixed, or not a new variable
							(variable.fixed == 'always' || !(value && value.notifies))) {
						return oldValue.put(value)
					}
					return when(variable.setValue(value, context), function(value) {
						variable.updated(Refresh, variable, context)
					})
				})
			},
			get: function(key) {
				return when(this.valueOf(), function(object) {
					var value = object && (typeof object.get === 'function' ? object.get(key) : object[key])
					if (value && value.notifies) {
						// nested variable situation, get underlying value
						return value.valueOf()
					}
					return value
				})
			},
			set: function(key, value) {
				// TODO: create an optimized route when the property doesn't exist yet
				this.property(key).put(value)
			},
			undefine: function(key, context) {
				this.set(key, undefined, context)
			},
			getForClass: getForClass,

			next: function(value) {
				// for ES7 observable compatibility
				this.put(value)
			},
			error: function(error) {
				// for ES7 observable compatibility
				var dependents = this.dependents
				if (dependents) {
					// make a copy, in case they change
					dependents = dependents.slice(0)
					for (var i = 0, l = dependents.length; i < l; i++) {
						try{
							var dependent = dependents[i]
							// skip notifying property dependents if we are headed up the parent chain
							dependent.error(error)
						}catch(e) {
							console.error(e, 'sending an error')
						}
					}
				}
			},
			complete: function(value) {
				// for ES7 observable compatibility
				this.put(value)
			},
			setValue: function(value) {
				this.value = value
			},
			onValue: function(listener) {
				return this.subscribe(function(event) {
					lang.when(event.value(), function(value) {
						listener(value)
					})
				})
			},
			forEach: function(callback, context) {
				// iterate through current value of variable
				return when(this.valueOf(), function(value) {
					if (value && value.forEach) {
						value.forEach(callback)
					}else{
						for (var i in value) {
							callback(value[i], i)
						}
					}
				})
			},
			each: function(callback) {
				// returns a new mapped variable
				// TODO: support events on array (using dstore api)
				return this.map(function(array) {
					return array.map(callback)
				})
			},

			map: function (operator) {
				// TODO: eventually make this act on the array items instead
				return this.to(operator)
			},
			to: function (operator) {
				// TODO: create a more efficient map, we don't really need a full variable here
				if (!operator) {
					throw new Error('No function provided to map')
				}
				return new Variable(operator).apply(null, [this])
			},
			get schema() {
				var schema = new Schema(this)
				Object.defineProperty(this, 'schema', {
					value: schema
				})
				return schema
			},
			get validate() {
				var schema = this.schema
				var validate = new Validating(this, schema)
				Object.defineProperty(this, 'validate', {
					value: validate
				})
				return validate
			},
			getId: function() {
				return this.id || (this.id = nextId++)
			}
		}
		// a variable inheritance change goes through its own prototype, so classes/constructor
		// can be used as variables as well
		setPrototypeOf(Variable, Variable.prototype)

		if (typeof Symbol !== 'undefined') {
			Variable.prototype[Symbol.iterator] = function() {
				return this.valueOf()[Symbol.iterator]()
			}
		}
		var cacheNotFound = {}
		var Caching = Variable.Caching = lang.compose(Variable, function(getValue, setValue) {
			if (getValue) {
				this.getValue = getValue
			}
			if (setValue) {
				this.setValue = setValue
			}
		}, {
			valueOf: function(context) {
				// first check to see if we have the variable already computed
				if (this.cachedVersion === this.getVersion()) {
					if (this.contextMap) {
						var contextualizedVariable = getDistinctContextualized(this, context)
						if (contextualizedVariable) {
							return contextualizedVariable.cachedValue
						}
					} else {
						return this.cachedValue
					}
				}
				
				var variable = this

				function withComputedValue(computedValue) {
					if (computedValue && computedValue.notifies && variable.dependents) {
						variable.computedVariable = computedValue
					}
					computedValue = variable.gotValue(computedValue, watchedContext)
					var contextualizedVariable
					if (watchedContext && watchedContext.distinctSubject) {
						(variable.contextMap || (variable.contextMap = new WeakMap()))
							.set(watchedContext.distinctSubject,
								contextualizedVariable = new ContextualizedVariable(variable, watchedContext.distinctSubject))
						context.distinctSubject = mergeSubject(context.distinctSubject, watchedContext.distinctSubject)
					} else {
						contextualizedVariable = variable
					}
					contextualizedVariable.cachedVersion = newVersion
					contextualizedVariable.cachedValue = computedValue
					return computedValue
				}

				var watchedContext
				if (context) {
					watchedContext = new Context(context.subject)
				}
				var newVersion = this.getVersion()
				var computedValue = this.getValue(watchedContext)
				if (computedValue && computedValue.then) {
					return computedValue.then(withComputedValue)
				} else {
					return withComputedValue(computedValue)
				}
			}
		})

		function GetCache() {
		}

		var Property = lang.compose(Variable, function Property(parent, key) {
			this.parent = parent
			this.key = key
		},
		{
			forDependencies: function(callback) {
				Variable.prototype.forDependencies.call(this, callback)
				callback(this.parent)
			},
			valueOf: function(context) {
				var key = this.key
				var property = this
				var object = this.parent.valueOf(context)
				function gotValueAndListen(object) {
					if (property.dependents) {
						var listeners = propertyListenersMap.get(object)
						if (listeners && listeners.observer && listeners.observer.addKey) {
							listeners.observer.addKey(key)
						}
					}
					var value = property.gotValue(object == null ? undefined : typeof object.get === 'function' ? object.get(key) : object[key])
					return value
				}
				if (object && object.then) {
					return when(object, gotValueAndListen)
				}
				return gotValueAndListen(object)
			},
			put: function(value, context) {
				return this._changeValue(context, RequestChange, value)
			},
			parentUpdated: function(updateEvent, context) {
				return Variable.prototype.updated.call(this, updateEvent, this.parent, context)
			},
			updated: function(updateEvent, by, context) {
				//if (updateEvent !== ToChild) {
					this._changeValue(context, updateEvent)
				//}
				return Variable.prototype.updated.call(this, updateEvent, by, context)
			},
			_changeValue: function(context, type, newValue) {
				var key = this.key
				var parent = this.parent
				return when(parent.valueOf(context), function(object) {
					if (object == null) {
						// nothing there yet, create an object to hold the new property
						var response = parent.put(object = typeof key == 'number' ? [] : {}, context)
					}else if (typeof object != 'object') {
						// if the parent is not an object, we can't set anything (that will be retained)
						return deny
					}
					if (type == RequestChange) {
						var oldValue = typeof object.get === 'function' ? object.get(key) : object[key]
						if (oldValue === newValue) {
							// no actual change to make
							return noChange
						}
						if (typeof object.set === 'function') {
							object.set(key, newValue)
						} else {
							object[key] = newValue
						}
					}
					var listeners = propertyListenersMap.get(object)
					// at least make sure we notify the parent
					// we need to do it before the other listeners, so we can update it before
					// we trigger a full clobbering of the object
					parent._propertyChange(key, object, context, type)
					if (listeners) {
						listeners = listeners.slice(0)
						for (var i = 0, l = listeners.length; i < l; i++) {
							var listener = listeners[i]
							if (listener !== parent) {
								// now go ahead and actually trigger the other listeners (but make sure we don't do the parent again)
								listener._propertyChange(key, object, context, type)
							}
						}
					}
				})
			}
		})
		Variable.Property = Property

		var Item = Variable.Item = lang.compose(Variable, function Item(value) {
			this.value = value
		}, {})

		var Composite = Variable.Composite = lang.compose(Caching, function Composite(args) {
			this.args = args
		}, {
			forDependencies: function(callback) {
				// depend on the args
				Caching.prototype.forDependencies.call(this, callback)
				var args = this.args
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					if (arg && arg.notifies) {
						callback(arg)
					}
				}
			},

			updated: function(updateEvent, by, context) {
				var args = this.args
				if (by !== this.notifyingValue && updateEvent !== Refresh) {
					// using a painful search instead of indexOf, because args may be an arguments object
					for (var i = 0, l = args.length; i < l; i++) {
						var arg = args[i]
						if (arg === by) {
							// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
							updateEvent = Refresh
							continue
						}
					}
				}
				Caching.prototype.updated.call(this, updateEvent, by, context)
			},

			getUpdates: function(since) {
				// this always issues updates, nothing incremental can flow through it
				if (!since || since.version < getVersion()) {
					return [new Refresh()]
				}
			},

			getVersion: function(context) {
				var args = this.args
				var version = Variable.prototype.getVersion.call(this, context)
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					if (arg && arg.getVersion) {
						version = Math.max(version, arg.getVersion(context))
					}
				}
				return version
			},

			getValue: function(context) {
				var results = []
				var args = this.args
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					results[i] = arg && arg.valueOf(context)
				}
				return whenAll(results, function(resolved) {
					return resolved
				})
			}
		})

		// a call variable is the result of a call
		var Call = lang.compose(Composite, function Call(functionVariable, args) {
			this.functionVariable = functionVariable
			this.args = args
		}, {
			forDependencies: function(callback) {
				// depend on the args
				Composite.prototype.forDependencies.call(this, callback)
				callback(this.functionVariable)
			},

			getValue: function(context) {
				var functionValue = this.functionVariable.valueOf(context)
				if (functionValue.then) {
					var call = this
					return functionValue.then(function(functionValue) {
						return call.invoke(functionValue, call.args, context)
					})
				}
				return this.invoke(functionValue, this.args, context)
			},

			getVersion: function(context) {
				// TODO: shortcut if we are live and since equals this.lastUpdate
				return Math.max(Composite.prototype.getVersion.call(this, context), this.functionVariable.getVersion(context))
			},

			execute: function(context) {
				var call = this
				return when(this.functionVariable.valueOf(context), function(functionValue) {
					return call.invoke(functionValue, call.args, context, true)
				})
			},

			put: function(value, context) {
				var call = this
				return when(this.valueOf(context), function(originalValue) {
					if (originalValue === value) {
						return noChange
					}
					return when(call.functionVariable.valueOf(context), function(functionValue) {
						return call.invoke(function() {
							if (functionValue.reverse) {
								functionValue.reverse.call(call, value, call.args, context)
								return Variable.prototype.put.call(call, value, context)
							}else{
								return deny
							}
						}, call.args, context)
					});				
				})
			},
			invoke: function(functionValue, args, context, observeArguments) {
				var instance = this.functionVariable.parent
				if (functionValue.handlesContext) {
					return functionValue.apply(instance, args, context)
				}else{
					var results = []
					for (var i = 0, l = args.length; i < l; i++) {
						var arg = args[i]
						results[i] = arg && arg.valueOf(context)
					}
					instance = instance && instance.valueOf(context)
					if (functionValue.handlesPromises) {
						return functionValue.apply(instance, results, context)
					}else{
						// include the instance in whenAll
						results.push(instance)
						// wait for the values to be received
						return whenAll(results, function(inputs) {
							if (observeArguments) {
								var handles = []
								for (var i = 0, l = inputs.length; i < l; i++) {
									var input = inputs[i]
									if (input && typeof input === 'object') {
										handles.push(observe(input))
									}
								}
								var instance = inputs.pop()
								try{
									var result = functionValue.apply(instance, inputs, context)
								}finally{
									when(result, function() {
										for (var i = 0; i < l; i++) {
											handles[i].done()
										}
									})
								}
								return result
							}
							var instance = inputs.pop()
							return functionValue.apply(instance, inputs, context)
						})
					}
				}
			},
			setReverse: function(reverse) {
				this.functionVariable.valueOf().reverse = reverse
				return this
			}
		})
		Variable.Call = Call

		var ContextualizedVariable = lang.compose(Variable, function ContextualizedVariable(Source, subject) {
			this.constructor = Source
			this.subject = subject
		}, {
			valueOf: function() {
				return this.constructor.valueOf(new Context(this.subject))
			},

			put: function(value) {
				return this.constructor.put(value, new Context(this.subject))
			},
			parentUpdated: function(event, context) {
				// if we receive an outside update, send it to the constructor
				this.constructor.updated(event, this.parent, this.context)
			}
		})


		function arrayMethod(name, sendUpdates) {
			Variable.prototype[name] = function() {
				var args = arguments
				var variable = this
				return when(this.cachedValue || this.valueOf(), function(array) {
					if (!array) {
						variable.put(array = [])
					}
					// try to use own method, but if not available, use Array's methods
					var result = array[name] ? array[name].apply(array, args) : Array.prototype[name].apply(array, args)
					if (sendUpdates) {
						sendUpdates.call(variable, args, result, array)
					}
					return result
				})
			}
		}
		arrayMethod('splice', function(args, result) {
			for (var i = 0; i < args[1]; i++) {
				this.updated({
					type: 'delete',
					previousIndex: args[0],
					oldValue: result[i]
				}, this)
			}
			for (i = 2, l = args.length; i < l; i++) {
				this.updated({
					type: 'add',
					value: args[i],
					index: args[0] + i - 2
				}, this)
			}
		})
		arrayMethod('push', function(args, result) {
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				this.updated({
					type: 'add',
					index: result - i - 1,
					value: arg
				}, this)
			}
		})
		arrayMethod('unshift', function(args, result) {
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				this.updated({
					type: 'add',
					index: i,
					value: arg
				}, this)
			}
		})
		arrayMethod('shift', function(args, results) {
			this.updated({
				type: 'delete',
				previousIndex: 0
			}, this)
		})
		arrayMethod('pop', function(args, results, array) {
			this.updated({
				type: 'delete',
				previousIndex: array.length
			}, this)
		})

		function iterateMethod(method) {
			Variable.prototype[method] = function() {
				return new IterativeMethod(this, method, arguments)
			}
		}

		iterateMethod('filter')
		//iterateMethod('map')

		var IterativeMethod = lang.compose(Composite, function(source, method, args) {
			this.source = source
			// source.interestWithin = true
			this.method = method
			this.args = args
		}, {
			getValue: function(context) {
				var method = this.method
				var args = this.args
				var variable = this
				return when(this.source.valueOf(context), function(array) {
					if (variable.dependents) {
						var map = variable.contextMap || (variable.contextMap = new WeakMap())
						var contextualizedVariable
						if (map.has(context.distinctSubject)) {
							contextualizedVariable = map.get(context.distinctSubject)
						} else {
							map.set(context.distinctSubject, contextualizedVariable = new ContextualizedVariable(variable, context.distinctSubject))
						}
						array.forEach(function(object) {
							registerListener(object, contextualizedVariable)
						})
					}
					if (context) {
						variable = variable.for(context)
					}
					return array && array[method] && array[method].apply(array, args)
				})
			},
			updated: function(event, by, context) {
				if (by === this || by && by.constructor === this) {
					return Composite.prototype.updated.call(this, event, by, context)
				}
				var propagatedEvent = event.type === 'refresh' ? event : // always propagate refreshes
					this[this.method + 'Updated'](event, context)
				// TODO: make sure we normalize the event structure
				if (this.dependents && event.oldValue && typeof event.value === 'object') {
					deregisterListener(this)
				}
				if (this.dependents && event.value && typeof event.value === 'object') {
					registerListener(event.value, getDistinctContextualized(this, context))
				}
				if (propagatedEvent) {
					Composite.prototype.updated.call(this, propagatedEvent, by, context)
				}
			},
			filterUpdated: function(event, context) {
				var contextualizedVariable = getDistinctContextualized(this, context)
				if (event.type === 'delete') {
					var index = contextualizedVariable.cachedValue.indexOf(event.oldValue)
					if (index > -1) {
						contextualizedVariable.splice(index, 1)
					}
				} else if (event.type === 'add') {
					if ([event.value].filter(this.args[0]).length > 0) {
						contextualizedVariable.push(event.value)
					}
				} else if (event.type === 'update') {
					var index = contextualizedVariable.cachedValue.indexOf(event.object)
					var matches = [event.object].filter(this.args[0]).length > 0
					if (index > -1) {
						if (matches) {
							return {
								type: 'updated',
								object: event.object,
								index: index
							}
						} else {
							contextualizedVariable.splice(index, 1)
						}
					}	else {
						if (matches) {
							contextualizedVariable.push(event.object)
						}
						// else nothing mactches
					}
					return
				} else {
					return event
				}
			},
			mapUpdated: function(event) {
				return {
					type: event.type,
					value: [event.value].map(this.args[0])
				}
			},
			forDependencies: function(callback) {
				// depend on the args
				Composite.prototype.forDependencies.call(this, callback)
				callback(this.source)
			},
			getVersion: function(context) {
				return Math.max(Composite.prototype.getVersion.call(this, context), this.source.getVersion(context))
			}		
		})


		var getValue
		var GeneratorVariable = Variable.GeneratorVariable = lang.compose(Variable.Composite, function ReactiveGenerator(generator){
			this.generator = generator
			this.args = []
		}, {
			getValue: getValue = function(context, resuming) {
				var lastValue
				var i
				var generatorIterator
				if (resuming) {
					// resuming from a promise
					generatorIterator = resuming.iterator
					i = resuming.i
					lastValue = resuming.value
				} else {
					// a fresh start
					i = 0
					generatorIterator = this.generator()				
				}
				
				var args = this.args
				do {
					var stepReturn = generatorIterator.next(lastValue)
					if (stepReturn.done) {
						return stepReturn.value
					}
					var nextVariable = stepReturn.value
					// compare with the arguments from the last
					// execution to see if they are the same
					if (args[i] !== nextVariable) {
						if (args[i]) {
							args[i].stopNotifies(this)
						}
						// subscribe if it is a variable
						if (nextVariable && nextVariable.notifies) {
							nextVariable.notifies(this)
							this.args[i] = nextVariable
						} else {
							this.args[i] = null
						}
					}
					i++
					lastValue = nextVariable && nextVariable.valueOf(context)
					if (lastValue && lastValue.then) {
						// if it is a promise, we will wait on it
						var variable = this
						// and return the promise so that the getValue caller can wait on this
						return lastValue.then(function(value) {
							return getValue.call(this, context, {
								i: i,
								iterator: generatorIterator,
								value: value
							})
						})
					}
				} while(true)
			}
		})

		var Validating = lang.compose(Caching, function(target, schema) {
			this.target = target
			this.targetSchema = schema
		}, {
			forDependencies: function(callback) {
				Caching.prototype.forDependencies.call(this, callback)
				callback(this.target)
				callback(this.targetSchema)
			},
			getVersion: function(context) {
				return Math.max(Variable.prototype.getVersion.call(this, context), this.target.getVersion(context), this.targetSchema.getVersion(context))
			},
			getValue: function(context) {
				return doValidation(this.target.valueOf(context), this.targetSchema.valueOf(context))
			}
		})

		var Schema = lang.compose(Caching, function(target) {
			this.target = target
		}, {
			forDependencies: function(callback) {
				Caching.prototype.forDependencies.call(this, callback)
				callback(this.target)
			},
			getVersion: function(context) {
				return Math.max(Variable.prototype.getVersion.call(this, context), this.target.getVersion(context))
			},
			getValue: function(context) {
				if (this.value) { // if it has an explicit schema, we can use that.
					return this.value
				}
				// get the schema, going through target parents until it is found
				return getSchema(this.target)
				function getSchema(target) {
					return when(target.valueOf(), function(value, context) {
						var schema
						return (value && value._schema) || (target.parent && (schema = target.parent.schema)
							&& (schema = schema.valueOf()) && schema[target.key])
					})
				}
			}
		})
		function validate(target) {
			var schemaForObject = schema(target)
			return new Validating(target, schemaForObject)
		}
		Variable.deny = deny
		Variable.noChange = noChange
		function addFlag(name) {
			Variable[name] = function(functionValue) {
				functionValue[name] = true
			}
		}
		addFlag(Variable, 'handlesContext')
		addFlag(Variable, 'handlesPromises')

		function observe(object) {
			var listeners = propertyListenersMap.get(object)
			if (!listeners) {
				propertyListenersMap.set(object, listeners = [])
			}
			if (listeners.observerCount) {
				listeners.observerCount++
			}else{
				listeners.observerCount = 1
				var observer = listeners.observer = lang.observe(object, function(events) {
					for (var i = 0, l = listeners.length; i < l; i++) {
						var listener = listeners[i]
						for (var j = 0, el = events.length; j < el; j++) {
							var event = events[j]
							listener._propertyChange(event.name, object)
						}
					}
				})
				if (observer.addKey) {
					for (var i = 0, l = listeners.length; i < l; i++) {
						var listener = listeners[i]
						listener.eachKey(function(key) {
							observer.addKey(key)
						})
					}
				}
			}
			return {
				remove: function() {
					if (!(--listeners.observerCount)) {
						listeners.observer.remove()
					}
				},
				done: function() {
					// deliver changes
					lang.deliverChanges(observer)
					this.remove()
				}
			}
		}

		function objectUpdated(object) {
			// simply notifies any subscribers to an object, that it has changed
			var listeners = propertyListenersMap.get(object)
			if (listeners) {
				for (var i = 0, l = listeners.length; i < l; i++) {
					listeners[i]._propertyChange(null, object)
				}
			}
		}

		function all(array) {
			// This is intended to mirror Promise.all. It actually takes
			// an iterable, but for now we are just looking for array-like
			if (array.length > -1) {
				return new Composite(array)
			}
			throw new TypeError('Variable.all requires an array')
		}

		function hasOwn(Target, createForInstance) {
			var ownedClasses = this.ownedClasses || (this.ownedClasses = new WeakMap())
			// TODO: assign to super classes
			var Class = this
			ownedClasses.set(Target, createForInstance || function() { return new Target() })
			return this
		}
		function getForClass(Target, type) {
			var createInstance = this.constructor.ownedClasses && this.constructor.ownedClasses.get(Target)
			if (createInstance) {
				if (type === 'key') {
					return this
				}
				var ownedInstances = this.ownedInstances || (this.ownedInstances = new WeakMap())
				var instance = ownedInstances.get(Target)
				if (!instance) {
					ownedInstances.set(Target, instance = createInstance(this))
					instance.subject = this
				}
				return instance
			}
		}
		function generalizeClass() {
			var prototype = this.prototype
			var prototypeNames = Object.getOwnPropertyNames(prototype)
			for(var i = 0, l = prototypeNames.length; i < l; i++) {
				var name = prototypeNames[i]
				Object.defineProperty(this, name, getGeneralizedDescriptor(Object.getOwnPropertyDescriptor(prototype, name), name, this))
			}
		}
		function getGeneralizedDescriptor(descriptor, name, Class) {
			if (typeof descriptor.value === 'function') {
				return {
					value: generalizeMethod(Class, name)
				}
			} else {
				return descriptor
			}
		}
		function generalizeMethod(Class, name) {
			// I think we can just rely on `this`, but we could use the argument:
			// function(possibleEvent) {
			// 	var target = possibleEvent && possibleEvent.target
			var method = Class[name] = function() {
				var instance = Class.for(this)
				return instance[name].apply(instance, arguments)
			}
			method.for = function(context) {
				var instance = Class.for(context)
				return function() {
					return instance[name].apply(instance, arguments)
				}
			}
			return method
		}

		var defaultContext = {
			name: 'Default context',
			description: 'This object is the default context for classes, corresponding to a singleton instance of that class',
			getForClass: function(Class, type) {
				if (type === 'key') {
					return this
				}
				return Class.defaultInstance
			},
			contains: function() {
				return true // contains everything
			}
		}
		function instanceForContext(Class, context) {
			if (!context) {
				throw new TypeError('Accessing a generalized class without context to resolve to an instance, call for(context) (where context is an element or related variable instance) on your variable first')
			}
			var instance = context.subject.getForClass && context.subject.getForClass(Class) || Class.defaultInstance
			context.distinctSubject = mergeSubject(context.distinctSubject, instance.subject)
			return instance
		}
		Variable.valueOf = function(context) {
			// contextualized getValue
			return instanceForContext(this, context).valueOf()
		}
		Variable.setValue = function(value, context) {
			// contextualized setValue
			return instanceForContext(this, context).put(value)
		}
		Variable.generalize = generalizeClass
		Variable.call = Function.prototype.call // restore these
		Variable.apply = Function.prototype.apply
		Variable.extend = function(properties) {
			// TODO: handle arguments
			var Base = this
			function ExtendedVariable() {
				if (this instanceof ExtendedVariable) {
					return Base.apply(this, arguments)
				} else {
					return ExtendedVariable.extend(properties)
				}
			}
			var prototype = ExtendedVariable.prototype = Object.create(this.prototype)
			ExtendedVariable.prototype.constructor = ExtendedVariable
			setPrototypeOf(ExtendedVariable, this)
			for (var key in properties) {
				var descriptor = Object.getOwnPropertyDescriptor(properties, key)
				Object.defineProperty(prototype, key, descriptor)
				Object.defineProperty(ExtendedVariable, key, getGeneralizedDescriptor(descriptor, key, ExtendedVariable))
			}
			if (properties && properties.hasOwn) {
				hasOwn.call(ExtendedVariable, properties.hasOwn)
			}
			return ExtendedVariable
		}
		Object.defineProperty(Variable, 'defaultInstance', {
			get: function() {
				return this.hasOwnProperty('_defaultInstance') ?
					this._defaultInstance : (
						this._defaultInstance = new this(),
						this._defaultInstance.subject = defaultContext,
						this._defaultInstance)
			}
		})
		Variable.hasOwn = hasOwn
		Variable.all = all
		Variable.objectUpdated = objectUpdated
		Variable.observe = observe

		return Variable
	}));

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function (create) {
		// laying out the graph of connected nodes
		var columns = [];
		var container;
		var boundX = window.innerWidth;
		var boundY = window.innerHeight;
		var allNodes = [];
		function tryPosition(position) {
			var column = columns[position.x];
			if (!column) {
				columns[position.x] = column = [];
			}
			if (position.x < 0 || position.x > boundX) {
				return {
					moved: Infinity
				};
			}
			var newPosition = {
				x: position.x,
				y: position.y,
				moved: 0
			};
			for (var i = 0, l = column.length; i < l; i++) {
				var cell = column[i];
				if (cell.y < position.y + position.height || cell.y + cell.height > position.y) {
					// overlap with this cell
					var position;
					if (cell.y + cell.height / 2 < position.y + position.height / 2) {
						// move down
						newPosition = {
							x: position.x,
							y: cell.y + cell.height + 5,
							moved: cell.y + cell.height - position.y + 5
						};
					} else {
						// move up
						newPosition = {
							x: position.x,
							y: cell.y - position.height - 5,
							moved: position.y + position.height - cell.y + 5
						};
					}
					break;
				}
			}
			if (position.height + newPosition.y > boundY) {
				newPosition.moved += position.height + newPosition.y - boundY;
				newPosition.y = boundY - position.height;
			}
			if (newPosition.y < 0) {
				newPosition.moved -= newPosition.y;
				newPosition.y = 0;
			}
			return newPosition;
		}

		function findPosition(from) {
			var best,
			    bestScore = 1;
			var fromX = from.x;
			var fromY = from.y;
			var bestProximity = Infinity;
			var bestPosition;
			tryDirections([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], 100);
			console.log('good enough from first round', bestProximity < 0.000000001);
			if (bestProximity > 0.000000001) {
				tryDirections([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], 50);
				tryDirections([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], 200);
				tryDirections([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], 400);
			}
			function tryDirections(directions, multiplier) {
				for (var i = 0; i < directions.length; i++) {
					var directionX = directions[i][0] * multiplier;
					var directionY = directions[i][1] * multiplier;
					var proposedX = fromX + directionX;
					var proposedY = fromY + directionY;
					if (proposedX + from.width > boundX) {
						proposedX = boundX - from.width;
					}
					if (proposedY + from.height > boundY) {
						proposedY = boundY - from.height;
					}
					if (proposedX < 0) {
						proposedX = 0;
					}
					if (proposedY < 0) {
						proposedY = 0;
					}
					var proximity = 1 / Math.pow(Math.max(proposedX, 0) + 100, 4) + 1 / Math.pow(Math.max(boundX - (proposedX + from.width), 0) + 100, 4) + 1 / Math.pow(Math.max(proposedY, 0) + 100, 4) + 1 / Math.pow(Math.max(boundY - (proposedY + from.height), 0) + 100, 4);
					for (var j = 0; j < allNodes.length; j++) {
						var node = allNodes[j];
						var nodePosition = getPosition(node);
						proximity += 1 / Math.pow(Math.pow(nodePosition.x + nodePosition.width - proposedX, 2) + Math.pow(proposedX + from.width - nodePosition.x, 2) - Math.pow(from.width, 2) / 2 - Math.pow(nodePosition.width, 2) / 2 + Math.pow(nodePosition.y + nodePosition.height - proposedY, 2) + Math.pow(proposedY + from.height - nodePosition.y, 2) - Math.pow(from.height, 2) / 2 - Math.pow(nodePosition.height, 2) / 2, 2);
					}
					if (proximity < bestProximity) {
						bestProximity = proximity;
						bestPosition = {
							x: proposedX,
							y: proposedY
						};
					}
				}
			}
			return bestPosition;
		}

		function makeConnection(source, target, label) {
			var sourceX = source.x;
			var sourceY = source.y;
			var targetX = target.x;
			var targetY = target.y;
			var angle = Math.atan((targetY - sourceY) / (targetX - sourceX));
			if (targetX < sourceX) {
				angle += Math.PI;
			}
			var arrowContainer = create(container, 'div');
			var arrow = create(arrowContainer, 'div', {
				position: 'absolute',
				left: sourceX + 'px',
				top: sourceY + 'px',
				backgroundColor: '#321',
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
				zIndex: 200,
				color: '#000',
				fontSize: '14px'
			});
			labelNode.textContent = label;
			return arrowContainer;
		}
		function getAbsolutePosition(node) {
			if (node.offsetParent) {
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

		function getPosition(node) {
			var xy = getAbsolutePosition(node);
			return {
				x: xy.x,
				y: xy.y,
				height: node.offsetHeight,
				width: node.offsetWidth
			};
		}
		var allEdges = [];
		function drawEdges(edges) {
			edges.forEach(function (edge) {
				if (edge.element && edge.element.parentNode) {
					edge.element.parentNode.removeChild(edge.element);
				}
				if (edge.source.offsetParent && edge.target.offsetParent) {
					var source = getPosition(edge.source);
					var target = getPosition(edge.target);
					if (source.x < target.x) {
						source.x += source.width;
					} else {
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
			setContainer: function setContainer(containerElement) {
				container = containerElement;
				columns = [];
				allNodes = [];
			},
			layout: function layout(nodes, edges) {
				nodes.forEach(function (node) {
					var to = node.to;
					if (to) {
						var toPosition = getAbsolutePosition(to);
						toPosition.width = node.offsetWidth;
						toPosition.height = node.offsetHeight;
						var position = findPosition(toPosition);
						node.style.left = position.x + 'px';
						node.style.top = position.y + 'px';
					}
					allNodes.push(node);
				});
				drawEdges(edges);
				allEdges = allEdges.concat(edges);
			},
			removeEdge: function removeEdge(edge) {
				allEdges.splice(allEdges.indexOf(edge), 1);
				if (edge.element.parentNode) {
					edge.element.parentNode.removeChild(edge.element);
				}
			},
			refresh: function refresh() {
				drawEdges(allEdges);
			}
		};
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
		// an API designed for creating elements with style. Not something you would normally want to do,
		// unless you happen to be building a UI from a bookmarklet
		var create = function create(parent, tagName, styles) {
			var element = parent.appendChild(document.createElement(tagName));
			for (var name in styles) {
				element.style[name] = styles[name];
			}
			return element;
		};
		function makeTriangle(parent, size) {
			return create(parent, 'div', {
				width: '0',
				height: '0',
				maringRight: '6px',
				borderTop: size + 'px solid transparent',
				borderBottom: size + 'px solid transparent',
				borderLeft: size + 'px solid #321'
			});
		}
		create.triangle = makeTriangle;
		return create;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }
/******/ ]);