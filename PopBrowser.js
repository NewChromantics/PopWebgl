
//	disable IOS browser's "touch and scroll a bit" to fix the DOM in place
function DisableTouchScroll()
{
	//	https://stackoverflow.com/a/7771215/355753
	document.ontouchmove = function(event)
	{
		event.preventDefault();
	}
	/*
	document.addEventListener('touchmove', function(e) {
							  e.preventDefault();
							  });
	 */
}
