function adjustForNewHeight()
{
}

function adjustForThisHeight(height)
{
}

function scrollToTop()
{
	window.scrollTo(0,0);
}

function updateSiteNav(sites)
{
	populateSiteNav(userSites.inOrder());
}

function selectSiteTool(siteId, toolId)
{
	// TODO:
	return selectSite(siteId);
}

function selectDirecttool(url)
{
	// TODO:
}

function resetPortal()
{
	// TODO:
}

function selectSite(siteId)
{
	// record current site
	userSiteId = siteId;

	// clear selected site tab
	$("*#e3_site_nav_item").removeClass("site_selected");
	
	// find the site
	var site = userSites.find(siteId);
	if (site != null)
	{
		$(site.a).addClass("site_selected");
		loadSite(site);
	}	

	return false;
}

$(function()
{
	// dialogs top relative to window
	e3_top = 130;

	autoSetDev();
	recordCdpUrl();
	setupLinks();
	loadGateway();
	
	// catch window resizing
	$(window).resize(debounce(function(){if (tool_obj.resize != undefined) tool_obj.resize(tool_obj);}));
});
