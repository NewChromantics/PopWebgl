
function TScreenVr(EyeParams)
{
	this.ProjectionMatrix = mat4.create();
	this.ViewMatrix = mat4.create();
	this.EyeParams = EyeParams;
	this.ViewportMinMax = new float4(0,0,1,1);
	
	this.GetWidth = function()
	{
		return this.EyeParams.renderWidth;
	}
	
	this.GetHeight = function()
	{
		return this.EyeParams.renderHeight;
	}
	
	this.GetViewportWidth = function()
	{
		return this.GetWidth() * (this.ViewportMinMax.z-this.ViewportMinMax.x);
	}
	
	this.GetViewportHeight = function()
	{
		return this.GetHeight() * (this.ViewportMinMax.w-this.ViewportMinMax.y);
	}
	
	//  unbind any frame buffer
	this.Bind = function()
	{
		gl.bindFramebuffer( gl.FRAMEBUFFER, null );
		let ViewportMinx = this.ViewportMinMax.x * this.GetWidth();
		let ViewportMiny = this.ViewportMinMax.y * this.GetHeight();
		let ViewportWidth = this.GetViewportWidth();
		let ViewportHeight = this.GetViewportHeight();
		//console.log("Viewport " + ViewportMinx +" "+ ViewportMiny +" "+ ViewportWidth +" "+ ViewportHeight );
		gl.viewport( ViewportMinx, ViewportMiny, ViewportWidth, ViewportHeight );
	}
	
	
	console.log(this.EyeParams);
}


//	gr: this display may need it's own context...
function TDisplay(VrDisplay)
{
	this.Size = new float3(2,2,2);
	this.VrDisplay = VrDisplay;
	this.ScreenLeft = null;
	this.ScreenRight = null;

	this.Render = function(OnDraw)
	{
		let DrawScreens = function(Time)
		{
			try
			{
				if ( this.VrDisplay.isPresenting )
				{
					this.VrDisplay.depthNear = 0.1;
					this.VrDisplay.depthFar = 10000;
					//this.VrDisplay.getFrameData( frameData );
				
					OnDraw( [this.ScreenLeft, this.ScreenRight ], Time );
				
					this.VrDisplay.submitFrame();
				}
			}
			catch(Exception)
			{
				//	rethrow
				throw Exception;
			}
			finally
			{
				//	trigger loop
				this.Render( OnDraw );
			}
		};
		this.VrDisplay.requestAnimationFrame( DrawScreens.bind(this) );
	}
	
	this.OnPresenting = function()
	{
		let LeftEye = VrDisplay.getEyeParameters('left');
		let RightEye = VrDisplay.getEyeParameters('right');
		this.ScreenLeft = new TScreenVr( LeftEye );
		this.ScreenRight = new TScreenVr( RightEye );
	}
	
	this.Enable = function(Canvas)
	{
		//	turn canvas into a VRLayer
		let Layers = [];
		Layers.push( { source: Canvas } );
		//throw "todo: Do we need to bind here?"
		this.VrDisplay.requestPresent(Layers).then( this.OnPresenting.bind(this) );
	}
	
	this.Disable = function()
	{
		this.VrDisplay.exitPresent();
		this.ScreenLeft = null;
		this.ScreenRight = null;
	}
	
	/*
	 window.addEventListener('vrdisplaypresentchange', onVRPresentChange, false);
	 window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
	 window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
	 */
	this.Init = function()
	{
		//	NEEds depth init?
		VrDisplay.depthNear = 0.1;
		VrDisplay.depthFar = 1024.0;
		//initWebGL(VrDisplay.capabilities.hasExternalDisplay);
		
		if ( VrDisplay.stageParameters )
		{
			let Stage = VrDisplay.stageParameters;
			let NewSize = new float3( Stage.sizeX, Stage.sizeY, Stage.sizeZ );
			//	if size is zero, keep existing
			this.Size.x = Math.max( this.Size.x, NewSize.x );
			this.Size.y = Math.max( this.Size.y, NewSize.y );
			this.Size.z = Math.max( this.Size.z, NewSize.z );
		}
		
		if ( !VrDisplay.capabilities.canPresent )
			throw "VR display cannot present. Skipped";
	}
	
	this.Init();
}

function TWebVr(OnDisplaysChanged)
{
	this.Displays = [];
	
	this.OnFoundDisplays = function(NewDisplays)
	{
		console.log("OnFoundDisplays");
		console.log(this);
		console.log(NewDisplays);
		for ( let d=0;	d<NewDisplays.length;	d++ )
		{
			try
			{
				let NewDisplay = new TDisplay(NewDisplays[d]);
				this.Displays.push( NewDisplay );
			}
			catch(Exception)
			{
				console.log(Exception);
			}
		}
		
		console.log(this.Displays);
		OnDisplaysChanged(this.Displays);
	}
	
	this.GetScreens = function()
	{
		let Screens = [];
		let EnumDisplay = function(Display)
		{
			if ( Display.ScreenLeft != null )
				Screens.push( Display.ScreenLeft );
			if ( Display.ScreenRight != null )
				Screens.push( Display.ScreenRight );
		}
		this.Displays.forEach( EnumDisplay );
		return Screens;
	}
	
	//	init with promise
	if ( !navigator.getVRDisplays )
	{
		throw "Webvr not supported; chrome://flags/#enable-webvr ";
	}
	
	//	we lose this in the scope so we have to bind (which returns a new function with this assigned to the value we specify)
	navigator.getVRDisplays().then(this.OnFoundDisplays.bind(this));
}
