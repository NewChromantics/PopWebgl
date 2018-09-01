
function TScreenVr(Name,GetEyeParams,ViewportMinMax)
{
	this.ProjectionMatrix = mat4.create();
	this.ViewMatrix = mat4.create();
	this.GetEyeParams = GetEyeParams;
	this.ViewportMinMax = ViewportMinMax;
	this.Rotation = new Quaternion();
	
	this.GetName = function()
	{
		return Name;
	}
	
	this.GetWidth = function()
	{
		let Width = this.GetEyeParams().renderWidth;
		return Width;
	}
	
	this.GetHeight = function()
	{
		let Height = this.GetEyeParams().renderHeight;
		return Height;
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
		//console.log("Viewport " + this.GetName() + ": " + ViewportMinx +" "+ ViewportMiny +" "+ ViewportWidth +" "+ ViewportHeight );
		gl.viewport( ViewportMinx, ViewportMiny, ViewportWidth, ViewportHeight );
	}
	
	
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
					let FrameData = new VRFrameData();
					this.VrDisplay.getFrameData(FrameData);

					this.VrDisplay.depthNear = 0.1;
					this.VrDisplay.depthFar = 10000;

					let Rot4 = FrameData.pose.orientation;
					let Rot = new Quaternion();
					Rot.Values = quat.fromValues( Rot4[0], Rot4[1], Rot4[2], Rot4[3] );
					quat.normalize( Rot.Values, Rot.Values );
					this.ScreenLeft.Rotation = Rot;
					this.ScreenRight.Rotation = Rot;
					
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
		let GetLeftEyeParams = function()
		{
			let EyeParams = VrDisplay.getEyeParameters('left');
			return EyeParams;
		}
		let GetRightEyeParams = function()
		{
			let EyeParams = VrDisplay.getEyeParameters('right');
			return EyeParams;
		}

		let Layers = VrDisplay.getLayers();
		
		//	so webvr provides 1 canvas and specifies a height & width for each eye.
		//	we're supposed to resize our canvas to fit it and then split the viewport
		//	i'm using the params directly in TScreenVr so over-draw instead
		//let LeftViewport = new float4( 0, 0, 0.5, 1 );
		//let RightViewport = new float4( 0.5, 0, 1, 1 );
		let LeftViewport = new float4( 0, 0, 1, 1 );
		let RightViewport = new float4( 1, 0, 2, 1 );

		if ( Layers.length )
		{
			console.log("todo: get viewport from layers");
			/*
			let layer = layers[ 0 ];
			leftBounds = layer.leftBounds !== null && layer.leftBounds.length === 4 ? layer.leftBounds : defaultLeftBounds;
			rightBounds = layer.rightBounds !== null && layer.rightBounds.length === 4 ? layer.rightBounds : defaultRightBounds;
			 */
		}
		
		this.ScreenLeft = new TScreenVr( 'LeftEye', GetLeftEyeParams, LeftViewport );
		this.ScreenRight = new TScreenVr( 'RightEye', GetRightEyeParams, RightViewport );
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
