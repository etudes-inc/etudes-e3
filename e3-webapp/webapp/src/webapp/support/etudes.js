jQuery.fn.reverse = [].reverse;

// stupid IE fix for Array indexOf being missing
if (!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(obj, start)
	{
		for (var i = (start || 0), j = this.length; i<j; i++)
		{
			if (this[i] == obj)
			{
				return i;
			}
		}
		return -1;
	};
}

if (!String.prototype.endsWith)
{
	String.prototype.endsWith = function(pattern)
	{
		var d = this.length - pattern.length;
		return d >= 0 && this.lastIndexOf(pattern) === d;
	};
}

if (!String.prototype.startsWith)
{
	String.prototype.startsWith = function(str)
	{
		return this.indexOf(str) == 0;
	};
}

if (!String.prototype.capitalize)
{
	String.prototype.capitalize = function()
	{
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
}

// add ":unckecked" selector
$.extend($.expr[':'],
{
	unchecked : function(obj)
	{
		return ((obj.type == 'checkbox' || obj.type == 'radio') && !$(obj).is(':checked'));
	}
});

function selectTool(item, data)
{
	// stop the prior tool
	stopTool();

	// clear current tool's object and title
	tool_obj = null;
	tool_obj_data = null;
	setTitle(null);

	// setup the tool load-time data
	tool_obj_data = data;

	var toolUrl = adjustToolUrl($(item).attr("href"));

	// load selected tool
	$("#e3_tool_body").addClass("e3_offstage").empty().load(toolUrl + ".html", function(responseText, textStatus, XMLHttpRequest)
	{
		// load the tool's script - the tool MUST call completeToolLoad() at the end of it's script
		$.getScript(toolUrl + ".js");
	});

	// change the tool items to show the new selected
	$("*#e3_tool_nav_item").removeClass("tool_selected");
	$(item).addClass("tool_selected");

	return false;
}

var version="VERSION";
function selectStandAloneTool(toolUrl, data)
{
	// stop the prior tool
	stopTool();

	// for stand alone, drop the left side, de-select site nav
	$("#e3_left_side").removeClass("e3_left_side").addClass("e3_offstage");
	$("*#e3_site_nav_item").removeClass("site_selected");
	userSiteId = null;

	// clear current tool's object and title
	tool_obj = null;
	tool_obj_data = null;
	setTitle(null);
	
	// setup the tool load-time data
	tool_obj_data = data;

	toolUrl = adjustToolUrl(toolUrl);

	// assure proper caching of the html and js via AJAX
	$.ajaxSetup({cache: true});

	// load selected tool, include the v=VERSION with current Etudes version (same for js)
	$("#e3_tool_body").addClass("e3_offstage").empty().load(toolUrl + ".html?v=" + version, function()
	{
		// load the tool's script - the tool MUST call completeToolLoad() at the end of it's script
		$.getScript(toolUrl + ".js?v=" + version);
	});

	return false;
}

function adjustToolUrl(toolUrl)
{
	if (!dev) return toolUrl;

	var parts = toolUrl.split("/");	// eg /sitebrowser/browsesites making "","sitebrowser","browsesites"
	return "../../../../../" + parts[1] + "/" + parts[1] + "-webapp/webapp/src/webapp/" + parts[2];
}

function completeToolLoad()
{
	if (tool_obj.start != undefined) tool_obj.start(tool_obj, tool_obj_data);
	tool_obj_data = null;
	
	if ((tool_obj.showReset != undefined) && (tool_obj.showReset == true))
	{
		$("#e3_tool_reset_ui").removeClass("e3_offstage");
		$("#e3_tool_reset").unbind("click").click(function(){tool_obj.reset(tool_obj);return false;});
	}
	else
	{
		$("#e3_tool_reset_ui").addClass("e3_offstage");
	}

	$("#e3_tool_body").removeClass("e3_offstage");
	adjustForNewHeight();
}

function stopTool()
{
	// stop the prior tool
	if (tool_obj != null)
	{
		cleanupDialogs(tool_obj.dialogIds);
		if (tool_obj.stop != undefined) tool_obj.stop(tool_obj, true);
	}
}

function loadSite(site)
{
	// make sure our left side is on screen
	if ($("#e3_left_side").hasClass("e3_offstage"))
	{
		$("#e3_left_side").removeClass("e3_offstage").addClass("e3_left_side");
	}

	loadToolNav(site.tools);
	
	if (site.presence == "1")
	{
		loadPresence();
	}
	else
	{
		hidePresence();
	}
	
	if (site.published == "0")
	{
		$("#e3_unpublished_site").removeClass("e3_offstage");
	}
	else
	{
		$("#e3_unpublished_site").addClass("e3_offstage");
	}
}

function setTitle(title)
{
	$("#e3_tool_title_text").empty();
	if (title != null)
	{
		$("#e3_tool_title_text").text(title);
	}
}

function loadPresence()
{
	// clear current presence object
	presence_obj = null;

	// load selected tool, running the start function when done
	$("#e3_presence").empty().load("apps/presence.html", function()
	{
		if (presence_obj.start != undefined) presence_obj.start(presence_obj);
	});
}

function hidePresence()
{
	$("#e3_presence").empty();
}

function loadToolNav(tools)
{
	$("#e3_tool_nav_list").empty();
	$.each(tools, function(index, value)
	{
		var li = $('<li><a id="e3_tool_nav_item"></a></li>');
		$("a",li).text(value.name);
		$("a",li).attr("href", value.tool);
		$("#e3_tool_nav_list").append(li);
		$("a",li).click(function()
		{
			return selectTool(this, value);
		});
	});

	selectTool($("#e3_tool_nav_item"), tools[0]);
}

function populateSiteNav(sites)
{
	$("#e3_site_nav_list").empty();
	$.each(sites, function(index, value)
	{
		// skip non-favorites
		if (value.visible == 0) return;

		var li = $('<li />');
		var a = $('<a id="e3_site_nav_item" />');
		$(li).append(a);
		$(a).text(value.title);
		$(a).attr("href", "");
		
		// for published or instructor instructorPrivileges sites, link to visit
		if ((value.published == "1") || (value.instructorPrivileges == "1"))
		{
			$(a).click(function()
			{
				return selectSite(value.siteId);
			});
		}
		else
		{
			$(a).click(function()
			{
				return alertUnpublishedSite(value.siteId);
			});
			$(a).addClass("site_unpublished");
		}
		value.a = a;
		$("#e3_site_nav_list").append(li);
	});
	
	// show which site is current
	if (userSiteId != null)
	{
		var curSite = userSites.find(userSiteId);
		if (curSite != null)
		{
			$("*#e3_site_nav_item").removeClass("site_selected");
			$(curSite.a).addClass("site_selected");
		}
	}
}

function alertUnpublishedSite(siteId)
{
	$("#e3_unpublishedSiteAlert").dialog('open');
	return false;
}

function loadGateway()
{
	$.getJSON("gateway.json", function(data)
	{
		$("#e3_site_nav_list").empty();

		loadSite(data.sites[0]);
	});
}

function createSelectCheckboxTd(obj, tr, id, oid)
{
	var td = $('<td />');
	$(tr).append(td);
	var input = $('<input type="checkbox" sid="' + id + '" oid="' + oid + '" />');
	$(td).append(input);
	$(input).click(function()
	{
		updateSelectStatus(obj, id);
	});
	return td;
}

function createSelectRadioLableTds(tr, id, name, value, label)
{
	var td = $('<td style="width:16px;" />');
	$(tr).append(td);
	var input = $('<input type="radio" id="' + id + '" name="' + name + '" value="' + value + '" />');
	$(input).attr("label", label);
	$(td).append(input);
	
	td = $('<td />');
	$(tr).append(td);
	var lbl = $('<label for="' + id + '" />').html(label);
	$(td).append(lbl);
}

function createSelectCheckboxLableTds(tr, id, name, value, label)
{
	var td = $('<td style="width:16px;" />');
	$(tr).append(td);
	var input = $('<input type="checkbox" id="' + id + '" name="' + name + '" value="' + value + '" />');
	$(input).attr("label", label);
	$(td).append(input);
	
	td = $('<td />');
	$(tr).append(td);
	var lbl = $('<label for="' + id + '" />').html(label);
	$(td).append(lbl);
}

function updateSelectStatus(obj, id)
{
	updateSelectAll(id);
	updateSelectDependentToolActions(obj, id);
}

function updateSelectAll(id)
{
	var allChecked = true;
	var anyDefined = false;
	$('[sid="' + id + '"]').each(function(index)
	{
		if ($(this).prop("checked") != true)
		{
			allChecked = false;
		}
		anyDefined = true;
	});

	// if there are no check boxes, hide the selectAll
	if (!anyDefined)
	{
		$('.selectAll[oid="' + id + '"]').addClass("e3_offstage");
	}
	
	// otherwise set the selectAll
	else
	{
		$('.selectAll[oid="' + id + '"]').removeClass("e3_offstage");
		$('.selectAll[oid="' + id + '"]').prop("checked", allChecked);
	}
}

function updateSelectDependentToolActions(obj, id)
{
	if (obj.currentMode.toolActionsElementId == null) return;

	var noneChecked = true;
	var numChecked = 0;
	var anyDefined = false;
	$('[sid="' + id + '"]').each(function(index)
	{
		if ($(this).prop("checked") == true)
		{
			noneChecked = false;
			numChecked = numChecked + 1;
		}
		anyDefined = true;
	});
	
	// if there are no check boxes, hide all the options
	if (!anyDefined)
	{
		$("#" + obj.currentMode.toolActionsElementId + " ul li[selectRequired=" + id + "]").addClass("offstage");
		$("#" + obj.currentMode.toolActionsElementId + " ul li[select1Required=" + id + "]").addClass("offstage");
	}

	// update those tool actions that require something in this select id to be selected
	else
	{
		$("#" + obj.currentMode.toolActionsElementId + " ul li[selectRequired=" + id + "]").removeClass("offstage");
		$("#" + obj.currentMode.toolActionsElementId + " ul li[select1Required=" + id + "]").removeClass("offstage");

		if (noneChecked)
		{
			$("#" + obj.currentMode.toolActionsElementId + " ul li[selectRequired=" + id + "] a").addClass("disabled");
			$("#" + obj.currentMode.toolActionsElementId + " ul li[select1Required=" + id + "] a").addClass("disabled");
		}
		else
		{
			$("#" + obj.currentMode.toolActionsElementId + " ul li[selectRequired=" + id + "] a").removeClass("disabled");
			
			if (numChecked == 1)
			{
				$("#" + obj.currentMode.toolActionsElementId + " ul li[select1Required=" + id + "] a").removeClass("disabled");				
			}
			else
			{
				$("#" + obj.currentMode.toolActionsElementId + " ul li[select1Required=" + id + "] a").addClass("disabled");				
			}
		}
	}
}

function clearSelectAll(id)
{
	$('.selectAll[oid="' + id + '"]').prop("checked", false);
}

function createIconTd(tr, icon, popup, click)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).addClass("center");
	$(td).html('<img src="support/icons/' + icon + '" title="' + popup + '" />');
	
	if (click != null)
	{
		$(td).click(click).addClass("hot");
	}
	return td;
}

function createReorderIconTd(tr, id, oid)
{
	var td = $('<td />');
	if (id != undefined) $(td).attr("sid", id);
	if (oid != undefined) $(td).attr("oid", oid);

	$(tr).append(td);

	$(td).addClass("center");
	$(td).addClass("e3_reorder");
	$(td).html('<img src="support/icons/reorder.png" title="Drag to Reorder" />');

	return td;
}

function createReorderIconDropDownTd(tr, iconId, oid, selectedOption, options, size, selectId, selectClass, change)
{
	var td = $('<td />');
	if (iconId != undefined) $(td).attr("sid", iconId);
	if (oid != undefined) $(td).attr("oid", oid);

	$(tr).append(td);

	$(td).addClass("e3_reorder");
	$(td).html('<img src="support/icons/reorder.png" title="Drag to Reorder" />');

	var select = $('<select id="' + selectId + '" size="' + size +'" />');
	if (selectClass != null) $(select).addClass(selectClass);
	if (change != null) $(select).change(change);		
	
	if (options != null)
	{
		$.each(options, function(index, value)
		{
			var option = $('<option value="' + value.value +'">' + value.title + '</option>');
			$(select).append(option);
		});
	}
	if (selectedOption != null) $(select).val(selectedOption);
	$(td).append(select);
	
	return td;
}

function createToggleIconTd(tr, state, icon, popupTrue, popupFalse, click)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).addClass("center").addClass("hot");
	if (!state)
	{
		$(td).addClass("dimmed");
	}
	var popup = state ? popupTrue : popupFalse;
	$(td).html('<img src="support/icons/' + icon + '" title="' + popup + '" />');
	$(td).click(click);
	return td;
}

function createToggleIconTdIcons(tr, state, iconOn, iconOff, popupTrue, popupFalse, click)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).addClass("center").addClass("hot");
	var icon = iconOn;
	if (!state)
	{
		icon = iconOff;
	}
	var popup = state ? popupTrue : popupFalse;
	$(td).html('<img src="support/icons/' + icon + '" title="' + popup + '" />');
	$(td).click(click);
	return td;
}

function createIconTextTd(tr, icon, text, popup)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).html('<img style="vertical-align:text-bottom" src="support/icons/' + icon + '" title="' + popup + '" />&nbsp;' + text);
	return td;
}

function createHotTd(tr, text, click)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).addClass("hot");
	$(td).text(text);
	$(td).click(click);
	return td;
}

function createTextTd(tr, text, style)
{
	var td = null;
	if (style != undefined)
	{
		td =  $('<td style="' + style + '" />');
	}
	else
	{
		td = $('<td />');
	}

	$(tr).append(td);

	$(td).text(text);
	return td;
}

function createHtmlTd(tr, text, style)
{
	var td = null;
	if (style != undefined)
	{
		td =  $('<td style="' + style + '" />');
	}
	else
	{
		td = $('<td />');
	}

	$(tr).append(td);

	$(td).html(text);
	return td;
}

function createLabelTd(tr, text, forId)
{
	var td = $('<td />');	
	$(tr).append(td);

	var label = $('<label />');
	$(label).attr("for", forId);
	$(label).html(text);
	$(td).append(label);

	return td;
}

function createEmptyTd(tr)
{
	var td = $('<td />');
	$(tr).append(td);
}

function createHeaderTd(tr, text, span)
{
	if (span == undefined) span = 100;
	var td = $('<td class="td_header" />');
	$(td).attr("colspan", span);
	$(tr).append(td);
	$(td).html(text);
	return td;
}

function createDateEditTd(tr, date, popup, id, oid)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).addClass("date");
	$(td).html('<input id="' + id + '" oid="' + oid + '"type="text" value="' + date + '" /><img src="support/icons/date.png" title="' + popup + '" />');
	return td;
}

function createTextEditTd(tr, value, width, id, oid)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).html('<input id="' + id + '" oid="' + oid + '" size="' + width + '" type="text" value="' + value + '" />');
	return td;
}

function createTextareaEditTd(tr, value, rows, cols, id, oid)
{
	var td = $('<td />');
	$(tr).append(td);

	$(td).html('<textarea id="' + id + '" oid="' + oid + '" rows="' + rows + '" cols="' + cols +'" >'  + value + '</textarea>');
	return td;
}

function createCheckboxTd(tr, value, id, oid, padding)
{
	var td = $('<td style="width:16px" />');
	$(tr).append(td);

	var paddingInsert = null;
	if (padding != undefined)
	{
		var paddingInsertHtml = "";
		for (var i = 0; i < padding; i++) paddingInsertHtml += "&nbsp;";
		paddingInsert = $('<span>' + paddingInsertHtml + '</span>');	
	}

	var input = $('<input type="checkbox" id="' + id + '" oid="' + oid + '" />');
	$(input).attr("checked", value);

	if (paddingInsert != null)
	{
		$(td).append($(paddingInsert).clone());
	}

	$(td).append(input);

	if (paddingInsert != null)
	{
		$(td).append(paddingInsert);
	}
	return td;
}

function createDropDownTd(tr, selectedOption, options, size, id, change)
{
	var td = $('<td />');
	$(tr).append(td);
	
	var select = $('<select id="' + id + '" size="' + size +'" />');
	if (change != null) $(select).change(change);		
	
	if (options != null)
	{
		$.each(options, function(index, value)
		{
			var option = $('<option value="' + value.value +'">' + value.title + '</option>');
			$(select).append(option);
		});
	}
	if (selectedOption != null) $(select).val(selectedOption);
	$(td).append(select);
	return td;
}

function populateToolModes(obj)
{
	if (obj.modeBarElementId != null)
	{
		var ul = $("<ul />");
		$("#" + obj.modeBarElementId).empty().append(ul);
	
		$.each(obj.modes, function(index, value)
		{
			var li = $('<li style="background-image:url(support/icons/' + value.icon + ');">' + value.title + '</li>');
			value.element = li;
			$(ul).append(li);
	
			if (index == 0)
			{
				$(li).addClass("e3_tool_mode_current");
			}
			else
			{
				$(li).addClass("e3_tool_mode_option");
				if (index == obj.modes.length-1) $(li).addClass("e3_tool_mode_last");
			}
			$(li).click(function(){selectToolMode(index, obj);return false;});
		});
	}

	// start with the first mode
	selectToolMode(0, obj);
}

function selectToolMode(index, obj)
{
	if (obj.modes == undefined) return;

	// stop
	if (obj.currentMode.stop != undefined) obj.currentMode.stop(obj, obj.currentMode, true);

	// style the mode bar
	$(obj.currentMode.element).removeClass("e3_tool_mode_current").addClass("e3_tool_mode_option");
	$(obj.modes[index].element).removeClass("e3_tool_mode_option").addClass("e3_tool_mode_current");

	// hide the mode's UI element
	if (obj.currentMode.elementId != null)
	{
		$("#" + obj.currentMode.elementId).addClass("e3_offstage");
	}

	// remember the current mode
	obj.currentMode = obj.modes[index];	

	// bring the current mode's UI element on stage
	if (obj.currentMode.elementId != null)
	{
		$("#" + obj.currentMode.elementId).removeClass("e3_offstage");
	}

	// set the mode title and icon
	if (obj.modeTitleElementId != null)
	{
		$("#" + obj.modeTitleElementId).empty().text(obj.modes[index].title).css("background-image", "url(support/icons/" + obj.modes[index].icon + ")");
	}

	// Note: lists have actions, headers, and list items
	// set this mode's actions
	populateToolItemActions(obj, obj.currentMode);

	// set the item table headers
	populateToolItemHeaders(obj, obj.currentMode);

	// set this mode's nav bar
	populateToolNavbar(obj, obj.currentMode.navBarElementId, obj.currentMode.navbar);
	
	// custom startup
	if (obj.currentMode.start != undefined) obj.currentMode.start(obj, obj.modes[index]);
	
	adjustForNewHeight();
}

function selectMinorMode(index, obj)
{
	// stop
	if (obj.currentMode.stop != undefined) obj.currentMode.stop(obj, obj.currentMode, true);

	// style the mode bar - clear the current mode
	$("*.e3_tool_mode_current").removeClass("e3_tool_mode_current").addClass("e3_tool_mode_option");

	// hide the mode's UI element
	if (obj.currentMode.elementId != null)
	{
		$("#" + obj.currentMode.elementId).addClass("e3_offstage");
	}

	// remember the current mode
	obj.currentMode = obj.minorModes[index];	

	// bring the current mode's UI element on stage
	if (obj.currentMode.elementId != null)
	{
		$("#" + obj.currentMode.elementId).removeClass("e3_offstage");
	}

	// set the mode title and icon
	if (obj.modeTitleElementId != null)
	{
		$("#" + obj.modeTitleElementId).empty().text(obj.currentMode.title).css("background-image", "url(support/icons/" + obj.currentMode.icon + ")");
	}

	// Note: lists have actions, headers, and list items
	// set this mode's actions
	populateToolItemActions(obj, obj.currentMode);

	// set the item table headers
	populateToolItemHeaders(obj, obj.currentMode);

	// set this mode's nav bar
	populateToolNavbar(obj, obj.currentMode.navBarElementId, obj.currentMode.navbar);
	
	// custom startup
	if (obj.currentMode.start != undefined) obj.currentMode.start(obj, obj.currentMode);
	
	adjustForNewHeight();
}

function populateToolItemActions(obj, mode)
{
	if (mode.toolActionsElementId == null) return;
	if (mode.toolActionsElementPopulated) return;

	var ul = $("<ul />");
	$("#" + mode.toolActionsElementId).empty().append(ul);

	$.each(mode.actions, function(index, value)
	{
		var selReq = "";
		if (value.selectRequired != null) selReq = ' selectRequired="' + value.selectRequired + '"';
		if (value.select1Required != null) selReq = ' select1Required="' + value.select1Required + '"';
		var li = $('<li' + selReq + ' />');
		var a = $('<a style="background-image:url(support/icons/' + value.icon + ');" href="" />');
		$(a).text(value.title);
		$(a).click(value.click);
		$(li).append(a);
		$(ul).append(li);
	});

	// fill with a space if there is nothing else to preserve the formatting
	if (mode.actions.length == 0)
	{
		$(ul).html("&nbsp;");
	}
}

function populateToolItemHeaders(obj, mode)
{
	if (mode.toolItemTableElementId == null) return;

	var tr = $("<tr />");
	$("#" + mode.toolItemTableElementId + " thead").empty().append(tr);

	$.each(mode.headers, function(index, value)
	{
		var th = $('<th />');
		
		if (value.type != null)
		{
			if (value.type == "checkbox")
			{
				$(th).html('<input class="selectAll" type="checkbox" oid="' + value.checkboxId + '" />');
				$(th).addClass("center");
			}
			else
			{
				$(th).addClass(value.type);
			}
		}

		if (value.title != null) $(th).text(value.title);
		if (value.click != null) $(th).click(value.click);
		$(tr).append(th);
	});
	
	enableSelectAllCheckbox(obj);
}

function enableSelectAllCheckbox(obj)
{
	$(".selectAll").unbind("click").click(function()
	{
		$('[sid="' + $(this).attr("oid") + '"]').prop("checked", $(this).prop("checked"));
		updateSelectDependentToolActions(obj, $(this).attr("oid"));
	});
}

function showAllToolModes(obj)
{
	$("*.e3_tool_mode_current").removeClass("e3_tool_mode_current").addClass("e3_tool_mode_option");
}

function clearToolNavbar(obj)
{
	if (obj.currentMode.navBarElementId == null) return;
	if ($.isArray(obj.currentMode.navBarElementId))
	{
		$.each(obj.currentMode.navBarElementId, function(index, barId)
		{
			$("#" + barId).empty();
		});
	}
	else
	{
		$("#" + obj.currentMode.navBarElementId).empty();
	}
}

function populateToolNavbar(obj, elementId, navbar)
{
	if (elementId == null) return;

	if ($.isArray(elementId))
	{
		$.each(elementId, function(index, barId)
		{
			populateAToolNavbar(obj, barId, navbar);
		});
	}
	else
	{
		populateAToolNavbar(obj, elementId, navbar);
	}
}

function populateAToolNavbar(obj, elementId, navbar)
{
	var bar = $("#" + elementId).empty();
	
	$.each(navbar, function(index, value)
	{
		if (value.text !== undefined)
		{
			var attrs = "";
			if (value.id !== undefined) attrs += 'id="' + value.id + '" ';
			if (value.sid !== undefined) attrs += 'sid="' + value.sid + '" ';
			var span = $('<span ' + attrs + '/>');
			$(span).text(value.text);
			if (value.right !== undefined) $(span).addClass("e3_right");
			if (value.additionalClass !== undefined) $(span).addClass(value.additionalClass);
			$(bar).append(span);
		}
		else
		{
			var id = "";
			if (value.id !== undefined) id = 'id="' + value.id + '" ';
			var input = $('<input ' + id + 'type="button" value="' + value.title + '" accesskey="' + value.access
							+ '" title="' + value.popup + '" style="background-image:url(support/icons/' + value.icon + ');" />');
			if (value.iconRight !== undefined)
			{
				$(input).addClass("e3_right_icon");
			}
			else
			{
				$(input).addClass("e3_left_icon");
			}
			$(input).addClass("e3_hot");
			if (value.right !== undefined) $(input).addClass("e3_right");
			if (value.additionalClass !== undefined) $(input).addClass(value.additionalClass);
			$(input).click(value.click);
			$(bar).append(input);					
		}
	});
	

	// fill with a space if there is nothing else to preserve the formatting
	if (navbar.length == 0)
	{
		$(bar).html("&nbsp;");
	}
}

function addSelectFilterToolNavbar(obj, elementId, title, selectId, size, change)
{
	var bar = $("#" + elementId);
	if (selectId !== undefined && document.getElementById(selectId) == undefined)
	{
		var select = $('<select id="' + selectId + '" size="1" />');
		$(select).addClass("e3_right");				
		$(select).change(change);						
		$(bar).append(select);
		
		var titleText = $('<span id="'+ selectId +'_title">'+ title +'</span>');
		$(titleText).addClass("e3_right");	
		$(bar).append(titleText);
	}
}

function logout()
{
	userId = null;
	userEid = null;
	userPassword = null;
	userSites.clear();
	userSiteId = null;
	tool = null;

	$("#e3_login_userid").val("");
	$("#e3_login_password").val("");
	$("#e3_header_loggedout").toggleClass("e3_offstage");
	$("#e3_header_loggedin").toggleClass("e3_offstage");

	loadGateway();

	return false;
}

function onLogin()
{
	// load sites, go to first one
	userSites.load(true, function()
	{
		// selectSite(userSites.inOrder()[0].siteId);

		// load dashboard
		selectStandAloneTool("/dashboard/dashboard");
	});
}

function setupLinks()
{
	// setup the header info area - login to start
	$("#e3_header_loggedout").toggleClass("e3_offstage");

	$("#e3_header_link_logout").attr("href", "").click(logout);
	$("#e3_header_link_dashboard").attr("href", "").click(function(){return selectStandAloneTool("/dashboard/dashboard");});
	$("#e3_header_link_mysites").attr("href", "").click(function(){return selectStandAloneTool("/mysites/mysites");});
	$("#e3_header_link_myfiles").attr("href", "").click(function(){return selectStandAloneTool("/myfiles/myfiles");});
	$("#e3_header_link_account").attr("href", "").click(function(){return selectStandAloneTool("/account/account");});
	$("#e3_header_link_prefs").attr("href", "").click(function(){return selectStandAloneTool("/preferences/preferences");});
	$("#e3_header_link_search").attr("href", "").click(function(){return selectStandAloneTool("/search/search");});

	$("#e3_header_loggedout_form").ajaxForm(
	{
		dataType:"json",
		beforeSubmit:function()
		{
			$("#e3_header_loggedout").toggleClass("e3_offstage");
			$("#e3_header_login_waiting").toggleClass("e3_offstage");
		},
		success:function(json)
		{
			$("#e3_header_login_waiting").toggleClass("e3_offstage");
			if (json["cdp:status"] == 0)
			{
				$("#e3_header_loggedin").toggleClass("e3_offstage");

				// record login
				userId = json.internalUserId;
				userEid = $("#e3_login_userid").val();
				userPassword = $("#e3_login_password").val();
				$("#e3_header_loggedinas").empty().text(json.displayName);
				
				onLogin();
			}
			else
			{
				// authentication failure
				$("#e3_header_loggedout").toggleClass("e3_offstage");
				userId = null;
				userEid = null;
				userPassword = null;
				$("#e3_authenticationFailure").dialog('open');
			}
		}
	});
	if (!dev)
	{
		$("#e3_header_loggedout_form").attr("action", "/cdp/authenticate");
	}
	else
	{
		$("#e3_header_loggedout_form").attr("action", "dev/authenticate.json");
	}

	$("#e3_header_loggedout_form").append('<input name="cdp_version" type="hidden" value="18" />');
	setupAlert("e3_authenticationFailure");
	setupAlert("e3_unpublishedSiteAlert");
}

function requestCdp(cdpRequest, data, completion, progressElementId)
{
	if (dev)
	{
		// the A version is throwing an error response in dev mode
		requestCdpF(cdpRequest, data, completion);
	}
	else if (window.FormData === undefined)
	{
		// IE sucks
		requestCdpF(cdpRequest, data, completion);
	}
	else if (progressElementId == undefined)
	{
		requestCdpA(cdpRequest, data, completion);
	}
	else
	{
		requestCdpAProgress(cdpRequest, data, completion, progressElementId);
	}
}

function topRedirectIfNotLoggedInElseCompletion(data, completion)
{
	if (data["cdp:status"] == 2)		// CdpStatus.notLoggedIn
	{
		parent.location.href = "/portal";
	}
	else
	{
		completion(data);
	}
}

function requestCdpF(cdpRequest, data, completion)
{
	// create a form
	var form = null;
	
	if (!dev)
	{
		form = $('<form method="post" encType="multipart/form-data" action="' + cdpUrl + cdpRequest + '" />');
	}
	else
	{
		var devCdpPath = "dev/";
		var parts = cdpRequest.split("_");
		if (parts.length > 1) devCdpPath = "../../../../../" + parts[0] + "/" + parts[0] + "-webapp/webapp/src/webapp/dev/";

		form = $('<form method="post" encType="multipart/form-data" action="' + devCdpPath + cdpRequest + '.json" />');
	}

	// stash it
	$("#e3_cdp").append(form);

	// populate with user id and password
	$(form).append('<input name="userid" type="hidden" value="' + userEid + '" />');
	$(form).append('<input name="password" type="hidden" value="' + userPassword + '" />');

	// add the CDP version
	$(form).append('<input name="cdp_version" type="hidden" value="18" />');

	// populate with the data
	if (data != null)
	{
		$.each(data, function(key, value)
		{			
			$(form).append('<input name="' + key + '" type="hidden" value="' + escapeValue(value) + '" />');				
		});
	}

	// add the site id
	if (userSiteId != null)
	{
		$(form).append('<input name="siteId" type="hidden" value="' + userSiteId + '" />');
	}

	// setup for ajax
	$(form).ajaxForm(
	{
		cache: false,
		dataType:"json",
		success:function(json)
		{
			// clear out the form
			$("#e3_cdp").empty();

			$("#e3_tool_loading").addClass("e3_offstage");
			// run the completion
			topRedirectIfNotLoggedInElseCompletion(json, completion);			
		}
	});

	// submit
	$("#e3_tool_loading").removeClass("e3_offstage");
	$(form).submit();
}

// setup a form for ajax submit
function setupForm(formElementId, cdpRequest, completion)
{
	$("#" + formElementId)
	.attr('action', cdpUrl + cdpRequest)
	.ajaxForm(
	{
		cache: false,
		dataType:"json",
		success:function(json)
		{
			topRedirectIfNotLoggedInElseCompletion(json, completion);
		}
	});
}

function makeFormData(data)
{
	var fd = new FormData;
	fd.append("cdp_version", "18");
	fd.append("userid", userEid);
	fd.append("password", userPassword);
	if (data != null)
	{
		$.each(data, function(key, value)
		{
			// TODO: escape of value needed?
			fd.append(key, value);
		});
	}

	// add the site id
	if (userSiteId != null)
	{
		fd.append("siteId", userSiteId);
	}

	return fd;
}

function makeCdpRequestUrl(cdpRequest)
{
	if (dev) return cdpRequest;
	return cdpUrl + cdpRequest;
}

function requestCdpA(cdpRequest, data, completion)
{
	var fd = makeFormData(data);
	$("#e3_tool_loading").removeClass("e3_offstage");

	$.ajax(
	{
		url: makeCdpRequestUrl(cdpRequest),
		type: "POST",
		data: fd,
		dataType:"json",
		error: function(jqXHR, textStatus, errorThrown){$("#e3_tool_loading").addClass("e3_offstage");},
		success: function(json, textStatus, jqXHR){$("#e3_tool_loading").addClass("e3_offstage");topRedirectIfNotLoggedInElseCompletion(json, completion);},
		processData: false,
		contentType: false
	});
}

function requestCdpAProgress(cdpRequest, data, completion, progressElementId)
{
	var fd = makeFormData(data);
	$.ajax(
	{
		url: makeCdpRequestUrl(cdpRequest),
		type: "POST",
		data: fd,
		dataType:"json",
		error: function(jqXHR, textStatus, errorThrown){},
		success: function(json, textStatus, jqXHR){topRedirectIfNotLoggedInElseCompletion(json, completion);},
		processData: false,
		contentType: false,

		// override this to set the progress events
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			// upload progress
			xhr.upload.addEventListener("progress", function(e){updateXhrProgress(e, progressElementId);}, false);
			// download progress
			// xhr.addEventListener("progress", function(e){updateXhrProgress(e, progressElementId);}, false);

			return xhr;
		}
	});
}

function updateXhrProgress(e, progressElementId)
{
	var percentComplete = (e.loaded / e.total) * 100;
	if (progressElementId != undefined)
	{
		$("#" + progressElementId).progressbar("option", "value", percentComplete);
	}
}

function registerDialog(dialogId)
{
	if (tool_obj != null)
	{
		if (tool_obj.dialogIds == undefined) tool_obj.dialogIds = new Array();
		tool_obj.dialogIds.push(dialogId);
	}
}

function adjustForNewHeight()
{
	if (dialogStack.length > 0)
	{
		adjustDialogHeight();
	}
	else
	{
		adjustForThisHeight(null);
	}
}

function adjustDialogHeight()
{
	var dialogHeight = 0;
	$.each(dialogStack, function(index, id)
	{
		var height = $("#" + id).height() + 120;
		if (height > dialogHeight) dialogHeight = height;
	});
	
	var docHeight = $(document.body).height();
	if (dialogHeight > docHeight) docHeight = dialogHeight;
	$('.ui-widget-overlay').height(docHeight).width($(document.body).width());
	adjustForThisHeight(docHeight);
}

function openConfirm(confirmId, doItName, doItFunction)
{
	registerDialog(confirmId);	

	$("#" + confirmId).dialog(
	{
		zIndex: 500,
		stack: false,
		autoOpen: true,
		modal: true,
		resizable: false,
		position: ["center", e3_top],
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		buttons:
		[
			{
				text: doItName,
				"class": "e3_primary_dialog_button",
				// Note: accesskey not working
				// accesskey: "s",
				click: function()
				{
					$(this).dialog("close");
					doItFunction();
				}
		 	},
			{
				text: "Cancel",
				click: function()
				{
					$(this).dialog("close");
				}
			}
		],
		open: function()
		{
			dialogStack.push(confirmId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
			unsetDialog(confirmId);
		}
	});
}

function setupConfirm(confirmId, doItName, doItFunction)
{
	registerDialog(confirmId);	

	$("#" + confirmId).dialog(
	{
		zIndex: 500,
		stack: false,
		autoOpen: false,
		modal: true,
		resizable: false,
		position: ["center", e3_top],
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		buttons:
		[
			{
				text: doItName,
				"class": "e3_primary_dialog_button",
				// Note: accesskey not working
				// accesskey: "s",
				click: function()
				{
					$(this).dialog("close");
					doItFunction();
				}
		 	},
			{
				text: "Cancel",
				click: function()
				{
					$(this).dialog("close");
				}
			}
		],
		open: function()
		{
			dialogStack.push(confirmId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
		}
	});
}

function setupDialog(dialogId, doItName, doItFunction)
{
	registerDialog(dialogId);	

	$("#" + dialogId).dialog(
	{
		zIndex: 100,
		stack: false,
		autoOpen: false,
		modal: true,
		resizable: false,
		position: ["center", e3_top],
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		buttons:
		[
			{
				text: doItName,
				"class": "e3_primary_dialog_button",
				// Note: accesskey not working
				// accesskey: "s",
				click: function()
				{
					if (doItFunction())
					{
						$(this).dialog("close");						
					}
				}
		 	},
			{
				text: "Cancel",
				click: function()
				{
					$(this).dialog("close");
				}
			}
		],
		open: function()
		{
			dialogStack.push(dialogId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
		}
	});

	// TODO: this almost works for alert and confirm, too - but, the keydown function is not being called unless the cursor is in a field in the dialog.
	/*
	$("#" + dialogId).keydown(function (event)
	{
		console.log(event);
		if (event.keyCode == $.ui.keyCode.ENTER)
		{
			$(this).parent().find('.ui-dialog-buttonpane button:first').click();
			event.preventDefault();
			return false;
		}
	});
	*/
}

function openDialog(dialogId, btns, z)
{
	registerDialog(dialogId);	

	var buttons = new Array();
	if ((btns != null) && (btns.length > 0))
	{
		for (var i = 0; i < btns.length; i++)
		{
			var b = new Object();
			b.text = btns[i].text;
			b.click = btns[i].click;
			buttons.push(b);
		}

		buttons[0]["class"] = "e3_primary_dialog_button";
	}

	var b = new Object();
	b.text = "Cancel";
	b.click = function(){$("#" + dialogId).dialog("close");return false;};
	buttons.push(b);
	
	var zIndex = 100;
	if (z != null) zIndex = z;

	$("#" + dialogId).dialog(
	{
		zIndex: zIndex,
		stack: false,
		autoOpen: true,
		modal: true,
		resizable: false,
		position: ["center", e3_top],
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		buttons: buttons,
		open: function()
		{
			dialogStack.push(dialogId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
			unsetDialog(dialogId);
		}
	});
}

function unsetDialog(id)
{
	$("#" + id).dialog("destroy");
}

function setupAlert(alertId, onClose)
{
	registerDialog(alertId);	

	$("#" + alertId).dialog(
	{
		zIndex: 800,
		stack: false,
		autoOpen: false,
		modal: true,
		resizable: false,
		position: ["center", e3_top],
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		open: function()
		{
			dialogStack.push(alertId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
			
			if (onClose) onClose();
		},
		buttons:
		[
			{
				text: "OK",
				"class": "e3_primary_dialog_button",
				// Note: accesskey not working
				// accesskey: "s",
				click: function()
				{
					$(this).dialog("close");
				}
			}
		]
	});
}

function openAlert(alertId, onClose)
{
	registerDialog(alertId);

	$("#" + alertId).dialog(
	{
		zIndex: 800,
		stack: false,
		autoOpen: true,
		modal: true,
		resizable: false,
		position: ["center", e3_top],
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		open: function()
		{
			dialogStack.push(alertId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
			
			if (onClose) onClose();
			unsetDialog(alertId);
		},
		buttons:
		[
			{
				text: "OK",
				"class": "e3_primary_dialog_button",
				// Note: accesskey not working
				// accesskey: "s",
				click: function()
				{
					$(this).dialog("close");
				}
			}
		]
	});
}

function openInPlaceAlert(alertId, t, onClose)
{
	registerDialog(alertId);

	$("#" + alertId).dialog(
	{
		zIndex: 800,
		stack: false,
		autoOpen: true,
		modal: true,
		resizable: false,
		position: { my: "left bottom", at: "center", of: t },
		draggable: false,
		width: 'auto',
		show:{effect: "fade"},
		hide:{effect: "fade"},
		open: function()
		{
			dialogStack.push(alertId);
			adjustDialogHeight();
			scrollToTop();
		},
		close: function()
		{
			dialogStack.pop();
			adjustForNewHeight();
			scrollToTop();
			
			if (onClose) onClose();
			unsetDialog(alertId);
		},
		buttons:
		[
			{
				text: "OK",
				"class": "e3_primary_dialog_button",
				// Note: accesskey not working
				// accesskey: "s",
				click: function()
				{
					$(this).dialog("close");
				}
			}
		]
	});
}

function cleanupDialogs(dialogIds)
{
	if (dialogIds != null)
	{
		$.each(dialogIds, function(index, dialogId)
		{
			cleanupDialog(dialogId);
		});
		
		dialogIds = new Array();
	}
}

function cleanupDialog(dialogId)
{
	// Note: http://bugs.jqueryui.com/ticket/5762 dialog() creation moves the element from its location, appending to the main body
	// we need it back where it belongs, so a) it's there to create again, and b) it's not left in the main body, accumulating multiple copies
	$("#" + dialogId).dialog("destroy").remove();
}

function collectSelectedOids(id)
{
	var rv = "";
	$('[sid="' + id + '"]:checked').each(function(index)
	{
		rv += $(this).attr("oid") + "\t";
	});
	
	return rv;
}

function arrayToTsv(data)
{
	var rv = "";
	$.each(data, function(index, value)
	{
		rv += value + "\t";
	});
	return rv;
}

function arrayToString(data)
{
	var rv = "";
	$.each(data, function(index, value)
	{
		rv += value;
	});
	return rv;
}

function collectSelectedOidsArray(id)
{
	var rv = new Array();
	$('[sid="' + id + '"]:checked').each(function(index)
	{
		rv.push($(this).attr("oid"));
	});

	return rv;
}

function collectSelectedAttrArray(id, attr)
{
	var rv = new Array();
	$('[sid="' + id + '"]:checked').each(function(index)
	{
		rv.push($(this).attr(attr));
	});

	return rv;
}

function collectAllOidsArray(id)
{
	var rv = new Array();
	$('[sid="' + id + '"]').each(function(index)
	{
		rv.push($(this).attr("oid"));
	});

	return rv;
}

function anyOidsSelected(id)
{
	return (collectSelectedOidsArray(id).length > 0);
}

function oneOidsSelected(id)
{
	return (collectSelectedOidsArray(id).length == 1);
}

function escapeValue(str)
{
	c = {'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;'};
	return str.replace(/[<&>"]/g, function(s) {return c[s];});
}

function autoSetDev()
{
	if ($(location).attr('protocol') == "file:")
	{
		dev = true;
	}
}

function recordCdpUrl()
{
	// TODO: don't add port for std port
	cdpUrl = $(location).attr('protocol') + "//" + $(location).attr('hostname') + ":" + $(location).attr('port') + "/cdp/";
}

function twoDigit(value)
{
	if (value >= 10)
	{
		return value.toString();
	}
	return "0" + value.toString();
}

function formatDateTime(date)
{
	var hour = date.getHours();
	var am = "AM";
	if (hour > 12)
	{
		hour -= 12;
		am = "PM";
	}
	var year = date.getFullYear().toString();
	year = year.slice(2,4);
	return date.getMonth()+1 + "/" + date.getDate() + "/" + year + " " + hour + ":" + twoDigit(date.getMinutes()) + " " + am;
}

function formatDate(date)
{
	var year = date.getFullYear().toString();
	year = year.slice(2,4);
	return date.getMonth()+1 + "/" + date.getDate() + "/" + year;
}

function formatTime(date)
{
	var hour = date.getHours();
	var am = "AM";
	if (hour > 12)
	{
		hour -= 12;
		am = "PM";
	}
	return hour + ":" + twoDigit(date.getMinutes()) + " " + am;
}

// the user's sites
var userSites =
{
	// the array of sites - in order
	sites: null,
	
	// if we have them sorted already, save it for later
	sitesByTerm: null,
	
	// when we last loaded
	updated: null,
	
	// if we want status with the sites
	withStatus: false,
	
	// if we want only a limited number with status (0 = all)
	statusLimit: 0,

	clear: function()
	{
		userSites.sites = null;
		userSites.sitesByTerm = null;
		userSites.updated = null;
	},

	updatedDate: function()
	{
		return formatDate(userSites.updated);
	},
	
	updatedTime: function()
	{
		return formatTime(userSites.updated);
	},

	inOrder: function()
	{
		return userSites.sites;
	},

	applyOrder: function(siteIds)
	{
		// first pull the sites with these ids into the new order
		var newSites = new Array();
		$.each(siteIds, function(index, value)
		{
			var s = userSites.find(value);
			newSites.push(s);

			// this site is visible now
			s.visible = 1;
		});

		// now get the rest, in the original order, that are not in the siteIds
		$.each(userSites.sites, function(index, value)
		{
			if (siteIds.indexOf(value.siteId) == -1)
			{
				newSites.push(value);
				
				// this site is now not visible
				value.visible = 0;
			}
		});

		// take the new order (the existing byTerm sort is still fine)
		userSites.sites = newSites;
	},

	// sort by term id, descending (second by title ascending)
	byTerm: function()
	{
		if (userSites.sitesByTerm != null) return userSites.sitesByTerm;

		var termOrder = userSites.sites.slice();
		termOrder.sort(function(a,b)
		{
			// we want a numeric sort!
			var ai = parseInt(a.termId);
			var bi = parseInt(b.termId);
			if (ai < bi) return 1;
			else if (ai > bi) return -1;
			
			// in a tie, use title ascending
			if (a.title < b.title) return -1;
			else if (a.title > b.title) return 1;
			
			// finally?
			if (a.siteId < b.siteId) return -1;
			else if (a.siteId > b.siteId) return 1;
			return 0;
		});
		
		userSites.sitesByTerm = termOrder;
		return termOrder;
	},
	
	load: function(force, completion)
	{
		var params = new Object();
		params.all = "1";

		if (userSites.withStatus) params.status = "1";
		if (userSites.statusLimit > 0) params.statusLimit = userSites.statusLimit.toString();
		userSites.withStatus = false;
		userSites.statusLimit = 0;

		// TODO: force or not based on force and date last loaded
		requestCdp("sites", params, function(data)
		{
			userSites.clear();

			// save the sites
			userSites.sites = data.sites;
			userSites.updated = new Date();
			
			updateSiteNav(userSites.inOrder());
			
			completion();
		});
	},
	
	find: function(siteId)
	{
		var found = null;
		$.each(userSites.sites, function(index, value)
		{
			if (value.siteId == siteId) found = value;
		});
		return found;
	}
};

// set this element to accept file drag-drop
function setupDrop(id, completion)
{
	var dropZone = $("#" + id);
	$(dropZone).on('drop', function(event)
	{
		$(dropZone).removeClass('e3_dropActive');
		if (completion != undefined)
		{
			completion(event.originalEvent.dataTransfer.files);
		}
		return false;
	});			
	$(dropZone).on('dragover', function(event)
	{
		return false;
	});
	$(dropZone).on('dragenter',function(event)
	{
		$(dropZone).addClass('e3_dropActive');
		return false;
	});
	$(dropZone).on('dragleave',function(event)
	{
		$(dropZone).removeClass('e3_dropActive');
		return false;
	});
}

function debounce(func, timeout)
{
	var timeoutID = null;
	var to = timeout || 200;
	return function()
	{
		var scope = this, args = arguments;
		clearTimeout(timeoutID);
		timeoutID = setTimeout(function()
		{
			func.apply(scope, Array.prototype.slice.call(args));
		}, to);
	};
};

// support for loading content into a view (homepage, sitebrowser, etc)
// content: source (letter), url, height, type (mime), ratio
function loadContent(destinationId, content, maxWidth, onload, loading)
{
	var destination = $("#" + destinationId);

	// web content
	if ((content.source == "W") || (content.source == "A") || (content.source == "F"))
	{
		loadWebContent(destination, content, maxWidth, onload, loading);
	}

	// youtube
	else if (content.source == "Y")
	{
		loadYoutubeContent(destination, content, maxWidth, onload, loading);
	}

	// TODO: others
	else
	{
		$(destination).append("<i>unknown</i>");
	}
};

function loadWebContent(destination, content, maxWidth, onload, loading)
{
	var type = content.type;
	if (type == "?") type = guessContentType(content.url);

	if (type.indexOf("image/") == 0)
	{
		loadImageContent(destination, content.url, content.alt, maxWidth, onload, loading);
	}
	else if (type.indexOf("text/html") == 0)
	{
		loadHtmlContent(destination, content.url, content.style, maxWidth, onload, loading);
	}
	else if (type.indexOf("text/") == 0)
	{
		loadTextContent(destination, content.url);
	}			
};

function loadYoutubeContent(destination, content, maxWidth, onload, loading)
{
	if (content.url == "")
	{
		if (onload != null) onload();
		return;
	}

	var el = $("<iframe allowfullscreen style='border-style:none;' />");
	var ratio = 1;
	if (content.style == "4:3") ratio = 3/4;
	if (content.style == "16:9") ratio = 9/16;
	$(el).width(maxWidth).height(maxWidth * ratio);
	$(destination).append(el);

	$(el).load(function()
	{
		if (loading != null) $(loading).addClass("e3_offstage");
		if (onload != null) onload();
	});

	if (loading != null) $(loading).removeClass("e3_offstage");
	$(el).attr("src", "//www.youtube.com/embed/" + content.url + "?rel=0&wmode=opaque");
};

function loadImageContent(destination, url, alt, maxWidth, onload, loading)
{
	if ((url == null) || (url == ""))
	{
		if (onload != null) onload();
		return;
	}

	var img = $("<img />").css("max-width", maxWidth);
	if (alt != null)
	{
		$(img).attr("alt", alt);
		$(img).attr("title", alt);
	}
	$(destination).append(img);
	$(img).load(function()
	{
		if (loading != null) $(loading).addClass("e3_offstage");
		if (onload != null) onload();
	});

	if (loading != null) $(loading).removeClass("e3_offstage");
	$(img).attr("src", url);
};

function loadHtmlContent(destination, url, height, maxWidth, onload, loading)
{
	if (url == "")
	{
		if (onload != null) onload();
		return;
	}

	var el = $("<iframe frameborder='0' style='border-style:none;' />");
	if ((height == null) || (height == "")) height = 900;
	$(el).width(maxWidth).height(height);
	$(destination).append(el);

	$(el).on("load", function()
	{
		if (loading != null) $(loading).addClass("e3_offstage");
		try
		{
			if ($(el).contents().height() != null)
			{
				// there may be a scroll bar at the bottom, so +16
				// the height adjust will fail for cross site content
				$(el).height($(el).contents().height()+16);
			}
		}
		catch(e){}
		if (onload != null) onload();
	});

	if (loading != null) $(loading).removeClass("e3_offstage");
	$(el).attr("src", url);
};

function loadTextContent(destination, url)
{
	$(destination).append("<pre id='home_pre' />");
	$("#home_pre").load(url);
};

function guessContentType(url)
{
	if (url == null) return "";

	if (url.endsWith(".png")) return "image/png";
	if (url.endsWith(".jpg"))  return "image/jpeg";
	if (url.endsWith(".jpeg"))  return "image/jpeg";
	if (url.endsWith(".gif"))  return "image/gif";
	if (url.endsWith(".tif"))  return "image/tiff";
	if (url.endsWith(".tiff"))  return "image/tiff";
	
	// TODO:
	return "text/html";
};

var heartbeatTimer = null;
function startHeartbeat()
{
	// reset the heartbeat for 30 seconds later
	clearTimeout(heartbeatTimer);
	heartbeatTimer = setTimeout(heartbeat, 30000);
}

function stopHeartbeat()
{
	clearTimeout(heartbeatTimer);
	heartbeatTimer = null;	
}

function heartbeat()
{
	// make the heartbeat request
	var data = new Object();
	requestCdp("heartbeat", data, function(data)
	{
		startHeartbeat();
	});
}

function processMathMl()
{
	com.wiris.plugin.viewer.EditorViewer.main();
}

// the CDP base url
var cdpUrl = "http://localhost:8080/cdp/";

// tools place their object here
var tool_obj = null;

// tools get their initial data here
var tool_obj_data = null;

// and our special 'tool' - presence's object
var presence_obj = null;

// the current site id
var userSiteId = null;

// the selected tool data
var tool = null;

// the logged in user info
var userId = null;
var userEid = null;
var userPassword = null;

// set to true to get local (development) cdp responses and run without a server
var dev = false;

// top of dialogs - different for tool or portal
var e3_top = 0;

var dialogStack = [];
