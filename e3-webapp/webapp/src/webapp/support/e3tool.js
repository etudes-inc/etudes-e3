function adjustForThisHeight(height)
{
	setTimeout(function(){if (height == null) height = $(document.body).height();$(parent.document.getElementById("MainE3")).height(height);}, 100);
}

function scrollToTop()
{
	parent.window.scrollTo(0,0);
}

function updateSiteNav(sites)
{
	// TODO: parent refresh?
}

function selectSite(siteId)
{
	// TODO: parent location change?
	parent.location.href = "/portal/site-home/" + siteId;
	return false;
}

function openSite(siteId)
{
	window.open("/portal/site-home/" + siteId, "_blank");
}

function resetPortal()
{
	parent.location.replace(parent.location);
}

function selectSiteTool(siteId, toolId)
{
	// TODO: parent location change?
	parent.location.href = "/portal/directtool/" + toolId + "?sakai.site=" + siteId + "&sakai.state.reset=true";
	return false;
}

function selectDirectTool(url)
{
	parent.location.href = "/portal/directtool" + url;
	return false;
}

var lastWindowWidth = 0;
var lastWindowHeight = 0;
$(function()
{
	// dialogs top relative to tool frame of E2 portal
	e3_top = 0;

	autoSetDev();
	recordCdpUrl();

	// catch window resizing
	lastWindowWidth = window.outerWidth;
	lastWindowHeight = window.outerHeight;
	$(window).resize(debounce(function()
	{
		if ((window.outerWidth != lastWindowWidth) || (window.outerHeight != lastWindowHeight))
		{
			lastWindowWidth = window.outerWidth;
			lastWindowHeight = window.outerHeight;
			if (tool_obj.resize != undefined) tool_obj.resize(tool_obj);
		}
	}));

	// take the tool from the search: example: ?/sitebrowser/sitebrowser@context
	var tool = window.location.search.substring(1).split("@");

	var data = new Object();
	data.siteId = tool[1];

	// set the version for loading AJAX html and js (in etudes.js)
	if (tool.length == 3)
	{
		version = tool[2];
	}
	else
	{
		version = tool[1];
	}

	selectStandAloneTool(tool[0], data);
});
