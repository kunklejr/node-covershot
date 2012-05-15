(function (window, document) {

	//
	// 
	//

	var browserSpecifics = {
		'webkit': 'webkitTransitionEnd',
		'Moz': 'transitionend',
		'O': 'oTransitionEnd',
		'ms': 'msTransitionEnd'
	};
	var browserPrefixes = Object.keys(browserSpecifics);
	var transitionEndEvent = browserSpecificTransitionEndEvent();
	var smStyleSheet = (function () {
		var ss = createLmnt('style', {'type':'text/css'});		
		document.getElementsByTagName('head')[0].appendChild(ss);
		ss = document.styleSheets[document.styleSheets.length - 1];

		addRulesToStyleSheet(ss, {
			'.smplContainer': [
				'display: inline-block',
				'position: relative',
				'box-shadow: 0px 1px 2px rgba(0, 0, 0, .6), inset 0 1px 2px rgba(255, 255, 255, 0.45)'
			],
			'.smplSubject': [
				'width: 0%',
				'height: 100%',
				'box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.45)',
			],
			'.invisible': [
				'margin: 0px',
				'position: absolute',
				'opacity: 0.0',
			],
			'.visible': [
				'margin: 0px',
				'opacity: 0.97',
				'position: absolute'
			]
		});

		return ss;
	})();

	//
	// Constructor and SimpleMeter definition
	//

	var SimpleMeter = function (container, settings) {
		settings = objMerge(settings || {}, {
			width: 200,
			height: 10,
			borderRadius: 7,
			topColor: 'rgba(0, 255, 0, 0.65)',
			bottomColor: 'rgba(255, 179, 179, 1.0)'
		});

		this.container = (typeof container === 'string') ? document.getElementById(container) : container;
		this.width = settings.width;
		this.height = settings.height;
		this.borderRadius = settings.borderRadius;
		this.topColor = settings.topColor;
		this.bottomColor = settings.bottomColor;

		var self = this;
		var smplContainer = addStyle(createLmnt('div', {
			'className': 'smplContainer'
		}), {
			'width': self.width + 'px',
			'height': self.height + 'px',
			'borderRadius': self.borderRadius + 'px',
			'backgroundColor': self.bottomColor
		});
		this.container.appendChild(smplContainer);

		var smplSubject = addStyle(createLmnt('div', {
			'className': 'smplSubject'
		}), {
			'width': 0,
			'borderRadius': self.borderRadius + 'px',
	 		'backgroundColor': self.topColor
		});
		this.powerBar = smplContainer.appendChild(smplSubject);

		var perPar = createLmnt('p', {
			'className': 'invisible'
		});
		this.perPar = perPar;
		this.perPar.innerHTML = '100.00%';
		smplContainer.appendChild(perPar);
		this.perPar = addStyle(self.perPar, {
			'top': '-' + (settings.height * 0.5) + 'px',
			'right': '-' + (perPar.clientWidth) + 'px'
		});
	}

	SimpleMeter.prototype = {
		add: function (width) {
			width = (width > 100) ? 100 : ((width < 0) ? 0 : width);

			this.powerBar = addStyle(this.powerBar, {
				'width': width + '%'
			});

			this.perPar.innerHTML = width + '%';
			var base = this.perPar.style.right;
			base = base.substring(0, base.length - 2);
			
			this.perPar = addStyle(this.perPar, {
				'left': (this.width) + 'px'
			});
			this.perPar.className = 'visible';
		},
		remove: function () {
			var meters = this.container.getElementsByClassName('smplContainer');
			for (var i = meters.length - 1; i >= 0; i--) {
				this.container.removeChild(meters[i]);
			};
		},
		powerUp: function (width, delay) {
			if (!width) {
				return;
			}

			width = (width > 100) ? 100 : ((width < 0) ? 0 : width);
			var bsTransitions = browserSpecify('Transition: all ' + (((width / 2) / 100) + 0.25) + 's ease ' + (delay * 0.001) + 's');
			var bsTransitionsHash = {};
			var self = this;

			for (var i in bsTransitions) {
				var cssRuleArray = bsTransitions[i].split(':');
				bsTransitionsHash[cssRuleArray[0]] = cssRuleArray[1];
			}
			this.powerBar = addStyle(this.powerBar, bsTransitionsHash);

			var onTransitionEnd = function (event) {
				self.perPar.innerHTML = width + '%';
				self.perPar = addStyle(self.perPar, bsTransitionsHash);

				var base = self.perPar.style.right;
				base = base.substring(0, base.length - 2);

				self.perPar = addStyle(self.perPar, {
					'right': (base - 15) + 'px'
				});
				self.perPar.className = 'visible';

				self.powerBar.removeEventListener(transitionEndEvent, onTransitionEnd, false);
			};
			this.powerBar.addEventListener(transitionEndEvent, onTransitionEnd, false);

			self.powerBar = addStyle(self.powerBar, {
				'width': width + '%'
			});
		}
	};

	window.SimpleMeter = SimpleMeter;

	//
	// Utility
	//

	function objMerge (tar) {
		var objs = Array.prototype.slice.call(arguments, 1);
		var obj, key;
		for (var i = objs.length - 1; i >= 0; i--) {
			for (key in objs[i]) {
				obj = objs[i];
				tar[key] = obj[key];
			}
		}
		return tar;
	}

	function createLmnt (tagName, attributes) {
		var element = document.createElement(tagName);
		for (var key in attributes) {
			element[key] = attributes[key];
		}
		return element;
	}

	function addRulesToStyleSheet (element, rewlz) {
		var rewlStrng;
		for (var r in rewlz) {
			rewlStrng = rewlz[r].reduce(function (pv, cv, i, a) {
				return pv + ' ' + cv + ';';
			}, "");
			element.insertRule(r + '{' + rewlStrng + '}', 0);
		}
	}

	function addStyle (ele, styles) {
		for (var key in styles) {
			ele.style[key] = styles[key];
		}
		return ele;
	}

	function browserSpecify (rule) {
		var rules = [];
		for (var p in browserPrefixes) {
			rules.push(browserPrefixes[p] + rule);
		}
		rules.push(rule);
		return rules;	
	}
	
	function browserSpecificTransitionEndEvent () {	
		var ele = createLmnt('div');
		for (var i in browserPrefixes) {
			var prefix = browserPrefixes[i];
			var transition = browserSpecifics[prefix];

			if (ele.style[(prefix + 'Transition')] !== undefined) {
				return transition;
			}
		}
	}

})(window, document);