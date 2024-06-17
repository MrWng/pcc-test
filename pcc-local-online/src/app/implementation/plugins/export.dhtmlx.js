(function () {

	var apiUrl = "http://ganttchart.apps.digiwincloud.com/gantt";

	var templates = [
		"leftside_text",
		"rightside_text",
		"task_text",
		"progress_text",
		"task_class"
	];

	function xdr (url, pack, cb) {
		switch (true) {
			case gantt.env.isIE:
				gantt.env.isIE = false;
				gantt.ajax.post(url, pack, cb);
				gantt.env.isIE = true;
				break;
			default:
				gantt.ajax.post(url, pack, cb);
		}
	}

	function defaults (obj, std) {
		for (var key in std)
			if (!obj[key])
				obj[key] = std[key];
		return obj;
	}

	//compatibility for new versions of gantt
	if (!gantt.ajax) {
		if (window.dhtmlxAjax) {
			gantt.ajax = window.dhtmlxAjax;
		} else if (window.dhx4) {
			gantt.ajax = window.dhx4.ajax;
		}
	}

	function mark_columns (base) {
		var columns = base.config.columns;
		if (columns)
			for (var i = 0; i < columns.length; i++) {
				if (columns[i].template)
					columns[i].$template = true;
			}
	}


	function add_export_methods (gantt) {
		var color_box = null;
		var color_hash = {};

		function get_styles (css) {
			if (!color_box) {
				var color_box = document.createElement("DIV");
				color_box.style.cssText = "position:absolute; display:none;";
				document.body.appendChild(color_box);
			}
			if (color_hash[css])
				return color_hash[css];

			color_box.className = css;
			return (color_hash[css] = get_color(color_box, "color") + ";" + get_color(color_box, "backgroundColor"));
		}


		function getMinutesWorktimeSettings (parsedRanges) {
			var minutes = [];
			parsedRanges.forEach(function (range) {
				minutes.push(range.startMinute);
				minutes.push(range.endMinute);
			});
			return minutes;
		}

		gantt._getWorktimeSettings = function () {

			var defaultWorkTimes = {
				hours: [0, 24],
				minutes: null,
				dates: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }
			};

			var time;
			if (!gantt.config.work_time) {
				time = defaultWorkTimes;
			} else {
				var wTime = gantt._working_time_helper;
				if (wTime && wTime.get_calendar) {
					time = wTime.get_calendar();
				} else if (wTime) {
					time = {
						hours: wTime.hours,
						minutes: null,
						dates: wTime.dates
					};
				} else if (gantt.config.worktimes && gantt.config.worktimes.global) {
					var settings = gantt.config.worktimes.global;

					if (settings.parsed) {
						var minutes = getMinutesWorktimeSettings(settings.parsed.hours);
						time = {
							hours: null,
							minutes: minutes,
							dates: {}
						};
						for (var i in settings.parsed.dates) {
							if (Array.isArray(settings.parsed.dates[i])) {
								time.dates[i] = getMinutesWorktimeSettings(settings.parsed.dates[i]);
							} else {
								time.dates[i] = settings.parsed.dates[i];
							}
						}
					} else {
						time = {
							hours: settings.hours,
							minutes: null,
							dates: settings.dates
						};
					}

				} else {
					time = defaultWorkTimes;
				};
			}

			return time;
		};

		gantt.exportToPDF = function (config) {
			if (config && config.raw) {
				config = defaults(config, {
					name: "gantt.pdf", data: this._serialize_html()
				});
			} else {
				config = defaults((config || {}), {
					name: "gantt.pdf",
					data: this._serialize_all(),
					config: this.config
				});
				fix_columns(gantt, config.config.columns);
			}

			config.version = this.version;
			this._send_to_export(config, "pdf");
		};

		gantt.exportToPNG = function (config) {
			if (config && config.raw) {
				config = defaults(config, {
					name: "gantt.png", data: this._serialize_html()
				});
			} else {
				config = defaults((config || {}), {
					name: "gantt.png",
					data: this._serialize_all(),
					config: this.config
				});
				fix_columns(gantt, config.config.columns);
			}

			config.version = this.version;
			this._send_to_export(config, "png");
		};

		gantt.exportToICal = function (config) {
			config = defaults((config || {}), {
				name: "gantt.ical",
				data: this._serialize_plain().data,
				version: this.version
			});
			this._send_to_export(config, "ical");
		};

		function eachTaskTimed (start, end) {
			return function (code, parent, master) {
				parent = parent || this.config.root_id;
				master = master || this;

				var branch = this.getChildren(parent);
				if (branch)
					for (var i = 0; i < branch.length; i++) {
						var item = this._pull[branch[i]];
						if ((!start || item.end_date > start) && (!end || item.start_date < end))
							code.call(master, item);

						if (this.hasChild(item.id))
							this.eachTask(code, item.id, master);
					}
			};
		}

		gantt.exportToExcel = function (config) {
			config = config || {};

			var tasks, dates;
			var state, scroll;
			if (config.start || config.end) {
				state = this.getState();
				dates = [this.config.start_date, this.config.end_date];
				scroll = this.getScrollState();
				var convert = this.date.str_to_date(this.config.date_format);
				tasks = this.eachTask;

				if (config.start)
					this.config.start_date = convert(config.start);
				if (config.end)
					this.config.end_date = convert(config.end);

				this.render();
				this.eachTask = eachTaskTimed(this.config.start_date, this.config.end_date);
			}

			this._no_progress_colors = config.visual === "base-colors";

			var data = null;
			if (!gantt.env.isNode) {
				data = this._serialize_table(config).data;
			}

			config = defaults(config, {
				name: "gantt.xlsx",
				title: "Tasks",
				data: data,
				columns: this._serialize_columns({ rawDates: true }),
				version: this.version
			});

			if (config.visual)
				config.scales = this._serialize_scales(config);

			this._send_to_export(config, "excel");


			if ((config.start || config.end) && state) {
				this.config.start_date = state.min_date;
				this.config.end_date = state.max_date;
				this.eachTask = tasks;

				this.render();
				this.scrollTo(scroll.x, scroll.y);

				this.config.start_date = dates[0];
				this.config.end_date = dates[1];
			}
		};

		gantt.exportToJSON = function (config) {
			config = defaults((config || {}), {
				name: "gantt.json",
				data: this._serialize_all(),
				config: this.config,
				columns: this._serialize_columns(),
				worktime: gantt._getWorktimeSettings(),
				version: this.version
			});
			this._send_to_export(config, "json");
		};

		function sendImportAjax (config) {
			var url = config.server || apiUrl;
			var store = config.store || 0;
			var formData = config.data;
			var callback = config.callback;

			formData.append("type", "excel-parse");
			formData.append("data", JSON.stringify({
				sheet: config.sheet || 0,
				server: url
			}));

			if (store)
				formData.append("store", store);

			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function (e) {
				if (xhr.readyState == 4 && xhr.status == 0) {// network error
					if (callback) {
						callback(null);
					}
				}
			};

			xhr.onload = function () {
				var fail = xhr.status > 400;
				var info = null;

				if (!fail) {
					try {
						info = JSON.parse(xhr.responseText);
					} catch (e) { }
				}

				if (callback) {
					callback(info);
				}
			};

			xhr.open('POST', url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(formData);
		}


		gantt.importFromExcel = function (config) {
			try {
				var formData = config.data;
				if (formData instanceof File) {
					var data = new FormData();
					data.append("file", formData);
					config.data = data;
				}
			}
			catch (error) { }
			sendImportAjax(config);
		};

		gantt._msp_config = function (config) {

			if (config.project)
				for (var i in config.project) {
					if (!config._custom_data)
						config._custom_data = {};
					config._custom_data[i] = config.project[i](this.config);
				}

			if (config.tasks)
				for (var j = 0; j < config.data.length; j++) {
					var el = this.getTask(config.data[j].id);
					if (!el._custom_data)
						el._custom_data = {};
					for (var i in config.tasks)
						el._custom_data[i] = config.tasks[i](el, this.config);
				}

			delete config.project;
			delete config.tasks;

			config.time = gantt._getWorktimeSettings();

			var p_dates = this.getSubtaskDates();
			var format = this.date.date_to_str("%d-%m-%Y %H:%i:%s");
			config.start_end = {
				start_date: format(p_dates.start_date),
				end_date: format(p_dates.end_date)
			};
		};

		gantt._msp_data = function () {
			var old_xml_format = this.templates.xml_format;
			var old_format_date = this.templates.format_date;
			this.templates.xml_format = this.date.date_to_str("%d-%m-%Y %H:%i:%s");
			this.templates.format_date = this.date.date_to_str("%d-%m-%Y %H:%i:%s");

			var data = this._serialize_all();

			this.templates.xml_format = old_xml_format;
			this.templates.format_date = old_format_date;
			return data;
		};

		gantt._ajax_to_export = function (data, type, callback) {
			delete data.callback;

			var url = data.server || apiUrl;
			var pack = "type=" + type + "&store=1&data=" + encodeURIComponent(JSON.stringify(data));

			var cb = function (loader) {
				var xdoc = loader.xmlDoc || loader;
				var fail = xdoc.status > 400;
				var info = null;

				if (!fail) {
					try {
						info = JSON.parse(xdoc.responseText);
					} catch (e) { }
				}
				callback(info);
			};

			xdr(url, pack, cb);
		};

		function serializableGanttConfig (config) {
			var result = gantt.mixin({}, config);

			if (result.columns) {
				result.columns = result.columns.map(function (col) {
					const copy = gantt.mixin({}, col);
					delete copy.editor;
					return copy;
				});
			}

			delete result.editor_types;
			return result;
		}

		gantt._send_to_export = function (data, type) {
			var convert = this.date.date_to_str(this.config.date_format || this.config.xml_date);
			if (data.config) {
				data.config = this.copy(serializableGanttConfig(data.config));
				mark_columns(data);

				if (data.config.start_date && data.config.end_date) {
					if (data.config.start_date instanceof Date) {
						data.config.start_date = convert(data.config.start_date)
					}
					if (data.config.end_date instanceof Date) {
						data.config.end_date = convert(data.config.end_date)
					}
				}
			}


			if (data.callback) {
				return gantt._ajax_to_export(data, type, data.callback);
			}


			var form = this._create_hidden_form();
			form.firstChild.action = data.server || apiUrl;
			form.firstChild.childNodes[0].value = JSON.stringify(data);
			form.firstChild.childNodes[1].value = type;
			form.firstChild.submit();
		};

		gantt._create_hidden_form = function () {
			if (!this._hidden_export_form) {
				var t = this._hidden_export_form = document.createElement("div");
				t.style.display = "none";
				t.innerHTML = "<form method='POST' target='_blank'><textarea name='data' style='width:0px; height:0px;' readonly='true'></textarea><input type='hidden' name='type' value=''></form>";
				document.body.appendChild(t);
			}
			return this._hidden_export_form;
		};

		//patch broken json serialization in gantt 2.1
		var original = gantt.json._copyObject;
		function copy_object_base (obj) {
			var copy = {};
			for (var key in obj) {
				if (key.charAt(0) == "$")
					continue;
				copy[key] = obj[key];
			}

			var formatDate = gantt.templates.xml_format || gantt.templates.format_date;

			copy.start_date = formatDate(copy.start_date);
			if (copy.end_date)
				copy.end_date = formatDate(copy.end_date);

			return copy;
		}

		function copy_object_plain (obj) {
			var text = gantt.templates.task_text(obj.start_date, obj.end_date, obj);

			var copy = copy_object_base(obj);
			copy.text = text || copy.text;

			return copy;
		}

		function get_color (node, style) {
			var value = node.currentStyle ? node.currentStyle[style] : getComputedStyle(node, null)[style];
			var rgb = value.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+)/i);
			return ((rgb && rgb.length === 4) ?
				("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : value).replace("#", "");
		}

		// Excel interprets UTC time as local time in every timezone, send local time instead of actual UTC time.
		// https://github.com/SheetJS/js-xlsx/issues/126#issuecomment-60531614
		var toISOstring = gantt.date.date_to_str("%Y-%m-%dT%H:%i:%s.000Z");

		// excel serialization
		function copy_object_table (obj) {
			var copy = copy_object_columns(obj, copy_object_plain(obj));
			if (copy.start_date)
				copy.start_date = toISOstring(obj.start_date);
			if (copy.end_date)
				copy.end_date = toISOstring(obj.end_date);

			// private gantt._day_index_by_date was replaced by public gantt.columnIndexByDate in gantt 5.0
			var getDayIndex = gantt._day_index_by_date ? gantt._day_index_by_date : gantt.columnIndexByDate;

			copy.$start = getDayIndex.call(gantt, obj.start_date);
			copy.$end = getDayIndex.call(gantt, obj.end_date);
			copy.$level = obj.$level;
			copy.$type = obj.$rendered_type;

			var tmps = gantt.templates;
			copy.$text = tmps.task_text(obj.start, obj.end_date, obj);
			copy.$left = tmps.leftside_text ? tmps.leftside_text(obj.start, obj.end_date, obj) : "";
			copy.$right = tmps.rightside_text ? tmps.rightside_text(obj.start, obj.end_date, obj) : "";

			return copy;
		}

		function copy_object_colors (obj) {
			var copy = copy_object_table(obj);

			var node = gantt.getTaskNode(obj.id);
			if (node && node.firstChild) {
				var color = get_color((gantt._no_progress_colors ? node : node.firstChild), "backgroundColor");
				if (color == "363636")
					color = get_color(node, "backgroundColor");

				copy.$color = color;
			} else if (obj.color)
				copy.$color = obj.color;

			return copy;
		}

		function copy_object_columns (obj, copy) {
			for (var i = 0; i < gantt.config.columns.length; i++) {
				var ct = gantt.config.columns[i].template;
				if (ct) {
					var val = ct(obj);
					if (val instanceof Date)
						val = gantt.templates.date_grid(val, obj);
					copy["_" + i] = val;
				}
			}
			return copy;
		}

		function copy_object_all (obj) {
			var copy = copy_object_base(obj);

			//serialize all text templates
			for (var i = 0; i < templates.length; i++) {
				var template = gantt.templates[templates[i]];
				if (template)
					copy["$" + i] = template(obj.start_date, obj.end_date, obj);
			}

			copy_object_columns(obj, copy);
			copy.open = obj.$open;
			return copy;
		}

		function fix_columns (gantt, columns) {
			for (var i = 0; i < columns.length; i++) {
				columns[i].label = columns[i].label || gantt.locale.labels["column_" + columns[i].name];
				if (typeof columns[i].width == "string") columns[i].width = columns[i].width * 1;
			}
		}

		gantt._serialize_html = function () {
			var smartScales = gantt.config.smart_scales;
			var smartRendering = gantt.config.smart_rendering;
			if (smartScales || smartRendering) {
				gantt.config.smart_rendering = false;
				gantt.config.smart_scales = false;
				gantt.render();
			}

			var html = this.$container.parentNode.innerHTML;

			if (smartScales || smartRendering) {
				gantt.config.smart_scales = smartScales;
				gantt.config.smart_rendering = smartRendering;
				gantt.render();
			}

			return html;
		};

		gantt._serialize_all = function () {
			gantt.json._copyObject = copy_object_all;
			var data = export_serialize();
			gantt.json._copyObject = original;
			return data;
		};

		gantt._serialize_plain = function () {
			var oldXmlFormat = gantt.templates.xml_format;
			var oldFormatDate = gantt.templates.format_date;
			gantt.templates.xml_format = gantt.date.date_to_str("%Y%m%dT%H%i%s", true);
			gantt.templates.format_date = gantt.date.date_to_str("%Y%m%dT%H%i%s", true);
			gantt.json._copyObject = copy_object_plain;

			var data = export_serialize();

			gantt.templates.xml_format = oldXmlFormat;
			gantt.templates.format_date = oldFormatDate;
			gantt.json._copyObject = original;

			delete data.links;
			return data;
		};

		function get_raw () {
			// support Gantt < 5.0
			if (gantt._scale_helpers) {
				var scales = gantt._get_scales(),
					min_width = gantt.config.min_column_width,
					autosize_min_width = gantt._get_resize_options().x ? Math.max(gantt.config.autosize_min_width, 0) : config.$task.offsetWidth,
					height = config.config.scale_height - 1;
				return gantt._scale_helpers.prepareConfigs(scales, min_width, autosize_min_width, height);
			} else { // Gantt >= 5.0
				var timeline = gantt.$ui.getView("timeline");
				if (timeline) {
					var availWidth = timeline.$config.width;
					if (gantt.config.autosize == "x" || gantt.config.autosize == "xy") {
						availWidth = Math.max(gantt.config.autosize_min_width, 0);
					}
					var state = gantt.getState(),
						scales = timeline._getScales(),
						min_width = gantt.config.min_column_width,
						height = gantt.config.scale_height - 1,
						rtl = gantt.config.rtl;
					return timeline.$scaleHelper.prepareConfigs(scales, min_width, availWidth, height, state.min_date, state.max_date, rtl);
				}
			}
		}

		gantt._serialize_table = function (config) {
			gantt.json._copyObject = config.visual ? copy_object_colors : copy_object_table;
			var data = export_serialize();
			gantt.json._copyObject = original;

			delete data.links;

			if (config.cellColors) {
				var css = this.templates.timeline_cell_class || this.templates.task_cell_class;
				if (css) {
					var raw = get_raw();
					var steps = raw[0].trace_x;
					for (var i = 1; i < raw.length; i++)
						if (raw[i].trace_x.length > steps.length)
							steps = raw[i].trace_x;

					for (var i = 0; i < data.data.length; i++) {
						data.data[i].styles = [];
						var task = this.getTask(data.data[i].id);
						for (var j = 0; j < steps.length; j++) {
							var date = steps[j];
							var cell_css = css(task, date);
							if (cell_css)
								data.data[i].styles.push({ index: j, styles: get_styles(cell_css) });
						}
					}
				}
			}
			return data;
		};

		gantt._serialize_scales = function (config) {
			var scales = [];
			var raw = get_raw();

			var min = Infinity;
			var max = 0;
			for (var i = 0; i < raw.length; i++) min = Math.min(min, raw[i].col_width);

			for (var i = 0; i < raw.length; i++) {
				var start = 0;
				var end = 0;
				var row = [];

				scales.push(row);
				var step = raw[i];
				max = Math.max(max, step.trace_x.length);
				var template = step.format || step.template || (step.date ? gantt.date.date_to_str(step.date) : gantt.config.date_scale);

				for (var j = 0; j < step.trace_x.length; j++) {
					var date = step.trace_x[j];
					end = start + Math.round(step.width[j] / min);

					var scale_cell = { text: template(date), start: start, end: end };

					if (config.cellColors) {
						var css = step.css || this.templates.scale_cell_class;
						if (css) {
							var scale_css = css(date);
							if (scale_css)
								scale_cell.styles = get_styles(scale_css);
						}
					}

					row.push(scale_cell);
					start = end;
				}
			}

			return { width: max, height: scales.length, data: scales };
		};

		gantt._serialize_columns = function (config) {
			gantt.exportMode = true;

			var columns = [];
			var cols = gantt.config.columns;

			var ccount = 0;
			for (var i = 0; i < cols.length; i++) {
				if (cols[i].name == "add" || cols[i].name == "buttons") continue;

				columns[ccount] = {
					id: ((cols[i].template) ? ("_" + i) : cols[i].name),
					header: cols[i].label || gantt.locale.labels["column_" + cols[i].name],
					width: (cols[i].width ? Math.floor(cols[i].width / 4) : "")
				};

				if (cols[i].name == "duration")
					columns[ccount].type = "number";
				if (cols[i].name == "start_date" || cols[i].name == "end_date") {
					columns[ccount].type = "date";
					if (config && config.rawDates)
						columns[ccount].id = cols[i].name;
				}

				ccount++;
			}

			gantt.exportMode = false;
			return columns;
		};

		function export_serialize () {
			gantt.exportMode = true;

			var xmlFormat = gantt.templates.xml_format;
			var formatDate = gantt.templates.format_date;

			// use configuration date format for serialization so date could be parsed on the export
			// required when custom format date function is defined
			gantt.templates.xml_format =
				gantt.templates.format_date =
				gantt.date.date_to_str(gantt.config.date_format || gantt.config.xml_date);

			var data = gantt.serialize();

			gantt.templates.xml_format = xmlFormat;
			gantt.templates.format_date = formatDate;
			gantt.exportMode = false;
			return data;
		}
	}

	add_export_methods(gantt);
	try {
		if (window && window.Gantt && Gantt.plugin) {
			Gantt.plugin(add_export_methods);
		} else {
			console.log('🚀gantt else', Gantt)
		}
	}
	catch (error) { 
		console.log('🚀gantt error', error)
	}

})();
