/*
	Common web (not javascript) stuff
*/

function DownloadData(Data,MimeType,Filename)
{
	var hiddenElement = document.createElement('a');
	hiddenElement.href = 'data:' + MimeType + ';charset=utf-8,' + encodeURI(Data);
	hiddenElement.target = '_blank';
	hiddenElement.download = Filename;
	hiddenElement.click();
}

