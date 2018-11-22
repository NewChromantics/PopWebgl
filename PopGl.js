function GetRed(Colour)
{
	let Value = parseInt( Colour.substring(0,2), 16);
	return Value / 255;
}

function GetGreen(Colour)
{
	let Value = parseInt( Colour.substring(2,4), 16);
	return Value / 255;
}

function GetBlue(Colour)
{
	let Value = parseInt( Colour.substring(4,6), 16);
	return Value / 255;
}

function GetAlpha(Colour)
{
	let Value = parseInt( Colour.substring(6,8), 16);
	return Value / 255;
}

function HexToColour4(Hex)
{
	let Colour4 = new float4(0,0,0,0);
	Colour4.x = GetRed( Hex );
	Colour4.y = GetGreen( Hex );
	Colour4.z = GetBlue( Hex );
	Colour4.w = GetAlpha( Hex );
	return Colour4;
}


function TContext(CanvasElement)
{
	this.Context = null;
	this.Canvas = CanvasElement;
	
	this.Context = CanvasElement.getContext("webgl");
	if ( !this.Context )
		throw "Failed to initialise webgl";

	this.GetGlContext = function()
	{
		return this.Context;
	}
	
	this.Clear = function(Colour4)
	{
		let gl = this.GetGlContext();
		let r = Colour4.x;
		let g = Colour4.y;
		let b = Colour4.z;
		let a = Colour4.w;
		gl.clearColor( r, g, b, a );
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	
	let gl = this.GetGlContext();
	gl.disable(gl.CULL_FACE);

	//	enable float textures on GLES1
	//	https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float
	var ext = gl.getExtension('OES_texture_float');
}


function GetTypeAndSize(Context,Type)
{
	let gl = Context.GetGlContext();
	if ( typeof Type == "number" )	return { Type:gl.FLOAT, Size:1 };
	if ( Type instanceof float2 ) return { Type:gl.FLOAT, Size:2 };
	if ( Type instanceof float3 ) return { Type:gl.FLOAT, Size:3 };
	if ( Type instanceof float4 ) return { Type:gl.FLOAT, Size:4 };
	throw "Unhandled type " + Type;
}


function TAttribute(Context,Uniform,Buffer)
{
	this.Uniform = Uniform;

	let TypeAndSize = GetTypeAndSize( Context, Buffer[0] );
	this.Type = TypeAndSize.Type;
	this.Size = TypeAndSize.Size;
	this.Stride = 0;
	this.Data = Buffer;
	
	this.EnumVertexData = function(EnumFloat)
	{
		let EnumFloats = function(Element)
		{
			if ( typeof Element == "number" )	{	EnumFloat(Element);	}
			else if ( Element instanceof float2 )	{	EnumFloat(Element.x);	EnumFloat(Element.y);	}
			else if ( Element instanceof float3 )	{	EnumFloat(Element.x);	EnumFloat(Element.y);	EnumFloat(Element.z);	}
			else if ( Element instanceof float4 )	{	EnumFloat(Element.x);	EnumFloat(Element.y);	EnumFloat(Element.z);	EnumFloat(Element.w);	}
			else throw "Unhandled type " + typeof Element;
		}
		this.Data.forEach( EnumFloats );
	}
}

function TGeometry(Name,PrimitiveType)
{
	this.Name = Name;
	this.Attributes = [];
	this.Buffer = null;		//	gl vertex buffer
	//	gl.TRIANGLE_STRIP
	//	gl.TRIANGLES etc
	this.PrimitiveType = PrimitiveType;
	
	this.bind = function()
	{
		throw "todo";
	}
	
	this.AddAttribute = function(Attribute)
	{
		//this.Attributes[Attribute.Uniform] = Attribute;
		this.Attributes[0] = Attribute;
	}
	
	this.CreateBuffer = function()
	{
	}
	
	this.GetVertexData = function()
	{
		let Floats = [];
		let EnumFloat = function(Float)
		{
			Floats.push( Float );
		};
		let EnumFloats = function(Attrib)
		{
			Attrib.EnumVertexData( EnumFloat );
		};
		this.Attributes.forEach( EnumFloats );
		return new Float32Array( Floats );
	}
}

function AllocPixelBuffer(Size,Colour8888)
{
	if ( Colour8888 instanceof float4 )
		Colour8888 = [ Colour8888.x * 255, Colour8888.y * 255, Colour8888.z * 255, Colour8888.w * 255 ];
	
	let PixelArray = new Array(Size*4);
	for ( let p=0;	p<Size;	p+=4 )
	{
		PixelArray[ p+0 ] = Colour8888[0];
		PixelArray[ p+1 ] = Colour8888[1];
		PixelArray[ p+2 ] = Colour8888[2];
		PixelArray[ p+3 ] = Colour8888[3];
	}
	return new Uint8Array(PixelArray);
}

function TTexture(Context,Name,WidthOrUrl,Height,OnChanged)
{
	this.Name = Name;
	this.Asset = null;
	this.Width = 0;
	this.Height = 0;
	this.Filename = null;
	this.OnChanged = OnChanged ? OnChanged : function(){};
	this.Context = Context;

	const TextureInitColour = HexToColour4('00ddffff');
	
	this.GetWidth = function()	{	return this.Width;	}
	this.GetHeight = function()	{	return this.Height;	}
	this.GetGlContext = function()	{	return this.Context.GetGlContext();	}

	this.CreateAsset = function()
	{
		let gl = this.GetGlContext();
		this.Asset = gl.createTexture();
	}
	
	this.WritePixels = function(Width,Height,Pixels,FilterMode)
	{
		let gl = this.GetGlContext();
		gl.bindTexture(gl.TEXTURE_2D, this.Asset );
		const level = 0;
		const internalFormat = gl.RGBA;
		const srcFormat = gl.RGBA;
		
		//	https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
		if ( Pixels instanceof ImageData ||
			Pixels instanceof HTMLImageElement ||
			Pixels instanceof HTMLCanvasElement ||
			Pixels instanceof HTMLVideoElement  )
		{
			const srcType = gl.UNSIGNED_BYTE;
			this.Width = Pixels.width;
			this.Height = Pixels.height;
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,	srcFormat, srcType, Pixels);
			this.OnChanged(this);
		}
		else if ( Pixels instanceof Uint8Array )
		{
			this.Width = Width;
			this.Height = Height;
			const srcType = gl.UNSIGNED_BYTE;
			const border = 0;
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, Width, Height, border, srcFormat, srcType, Pixels);
			this.OnChanged(this);
		}
		else if ( Pixels instanceof Float32Array )
		{
			this.Width = Width;
			this.Height = Height;
			const srcType = gl.FLOAT;
			const border = 0;
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, Width, Height, border, srcFormat, srcType, Pixels);
			this.OnChanged(this);
		}
		else if ( Pixels instanceof TTexture )
		{
			this.Width = Width;
			this.Height = Height;
			const srcType = gl.FLOAT;
			const border = 0;
			let FrameBuffer = new TRenderTarget( this.Context, "Temporary texture render target", Pixels );
			FrameBuffer.Bind();
			
			//	gr: rebind just in case
			gl.bindTexture(gl.TEXTURE_2D, this.Asset );
			gl.copyTexImage2D(gl.TEXTURE_2D, level, internalFormat, 0, 0, Width, Height, border);

			FrameBuffer.Delete();
		}
		else
		{
			throw "Don't know how to write pixels from source: " + (typeof Pixels);
		}
		
		// WebGL1 has different requirements for power of 2 images
		// vs non power of 2 images so check if the image is a
		// power of 2 in both dimensions.
		// No, it's not a power of 2. Turn of mips and set
		// wrapping to clamp to edge
		
		let RepeatMode = gl.CLAMP_TO_EDGE;
		//let RepeatMode = gl.REPEAT;
		
		if ( FilterMode === undefined )
			FilterMode = gl.LINEAR;
		else if ( FilterMode === true )
			FilterMode = gl.LINEAR;
		else if ( FilterMode === false )
			FilterMode = gl.NEAREST;

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, RepeatMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, RepeatMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, FilterMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, FilterMode);

	}
	
	this.Load = function(Url,ForcedFilename,Filter)
	{
		console.log("Loading " + Url);
		if ( ForcedFilename === undefined )
			ForcedFilename = Url;
			
		//	init whilst we wait for load
		this.WritePixels( 1, 1, AllocPixelBuffer( 1, TextureInitColour ) );
		
		const image = new Image();
		image.crossOrigin = "anonymous";
		let This = this;
		image.onload = function()
		{
			This.WritePixels( 0, 0, image, Filter );
			This.Filename = ForcedFilename;
			console.log("Loaded " + This.Filename);
		};
		//  trigger load
		image.src = Url;
	}
	
	this.GetFilenameNoExtension = function()
	{
		if ( this.Filename == null )
			return "";
		
		let Paths = this.Filename.split('/');
		let RawFilename = Paths[Paths.length-1];
		let Parts = RawFilename.split('.');
		if ( Parts.length > 0 )
			Parts.pop();
		RawFilename = Parts.join('.');
		return RawFilename;
	}
	
	
	//  auto init
	if ( typeof WidthOrUrl === 'number' )
	{
		this.CreateAsset();
		let Width = WidthOrUrl;
		let Pixels = AllocPixelBuffer( Width*Height, TextureInitColour );
		this.WritePixels( Width, Height, Pixels );
	}
	else if ( typeof WidthOrUrl === 'string' )
	{
		let Url = WidthOrUrl;
		this.CreateAsset();
		this.Load( Url );
	}
	else if ( WidthOrUrl instanceof Image )
	{
		this.CreateAsset();
		this.WritePixels( 0, 0, WidthOrUrl );
	}
	else
	{
		//	defalt init
		this.CreateAsset();
		this.WritePixels( 1, 1, AllocPixelBuffer( 1, TextureInitColour ) );
	}
}

function TScreen(Context,CanvasElement,ViewportMinMax)
{
	if ( ViewportMinMax === undefined )
		ViewportMinMax = new float4(0,0,1,1);

	this.Context = Context;
	this.CanvasElement = CanvasElement;
	this.ViewportMinMax = ViewportMinMax;
	
	this.GetGlContext = function()
	{
		return this.Context.GetGlContext();
	}
	
	this.GetWidth = function()
	{
		return this.CanvasElement.width;
	}
	
	this.GetHeight = function()
	{
		return this.CanvasElement.height;
	}
	
	this.GetViewportWidth = function()
	{
		return this.GetWidth() * (ViewportMinMax.z-ViewportMinMax.x);
	}
	
	this.GetViewportHeight = function()
	{
		return this.GetHeight() * (ViewportMinMax.w-ViewportMinMax.y);
	}

	//  unbind any frame buffer
	this.Bind = function()
	{
		let gl = this.GetGlContext();
		gl.bindFramebuffer( gl.FRAMEBUFFER, null );
		let ViewportMinx = ViewportMinMax.x * this.GetWidth();
		let ViewportMiny = ViewportMinMax.y * this.GetHeight();
		let ViewportWidth = this.GetViewportWidth();
		let ViewportHeight = this.GetViewportHeight();
		gl.viewport( ViewportMinx, ViewportMiny, ViewportWidth, ViewportHeight );
	}
}

function TRenderTarget(Context,Name,Texture)
{
	this.Name = Name;
	this.FrameBuffer = null;
	this.Texture = null;
	this.Context = Context;
	
	this.GetGlContext = function()
	{
		return this.Context.GetGlContext();
	}
	
	this.CreateFrameBuffer = function(Texture)
	{
		let gl = this.GetGlContext();
		this.FrameBuffer = gl.createFramebuffer();
		this.Texture = Texture;
		
		this.Bind();
		
		//  attach this texture to colour output
		const level = 0;
		const attachmentPoint = gl.COLOR_ATTACHMENT0;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this.Texture.Asset, level);
	}
	
	this.Delete = function()
	{
		let gl = this.GetGlContext();
		gl.deleteFramebuffer( this.FrameBuffer );
		this.FrameBuffer = null;
	}
	
	//  bind for rendering
	this.Bind = function()
	{
		let gl = this.GetGlContext();
		gl.bindFramebuffer( gl.FRAMEBUFFER, this.FrameBuffer );
		gl.viewport(0, 0, this.GetWidth(), this.GetHeight() );
	}
	
	this.GetWidth = function()
	{
		return this.Texture.GetWidth();
	}
	
	this.GetHeight = function()
	{
		return this.Texture.GetHeight();
	}
	
	if ( Texture !== undefined )
		this.CreateFrameBuffer( Texture );
}



function TShader(Context,Name,VertShaderSource,FragShaderSource)
{
	this.Name = Name;
	this.VertShader = null;
	this.FragShader = null;
	this.Program = null;
	this.CurrentTextureIndex = 0;
	this.Context = Context;
	
	this.GetGlContext = function()
	{
		return this.Context.GetGlContext();
	}
	
	this.CompileShader = function(Type,Source)
	{
		let gl = this.GetGlContext();
		let Shader = gl.createShader(Type);
		gl.shaderSource( Shader, Source );
		gl.compileShader( Shader );
		
		let CompileStatus = gl.getShaderParameter( Shader, gl.COMPILE_STATUS);
		if ( !CompileStatus )
		{
			let Error = gl.getShaderInfoLog(Shader);
			throw "Failed to compile " + Type + " shader: " + Error;
		}
		return Shader;
	}
	
	this.CompileProgram = function()
	{
		let gl = this.GetGlContext();
		let Program = gl.createProgram();
		gl.attachShader( Program, this.VertShader );
		gl.attachShader( Program, this.FragShader );
		gl.linkProgram( Program );
		
		let LinkStatus = gl.getProgramParameter( Program, gl.LINK_STATUS );
		if ( !LinkStatus )
		{
			//let Error = gl.getShaderInfoLog(Shader);
			throw "Failed to link " + this.Name + " shaders";
		}
		return Program;
	}
	
	this.Bind = function()
	{
		let gl = this.GetGlContext();
		gl.useProgram( this.Program );
		
		//	reset texture counter everytime we bind
		this.CurrentTextureIndex = 0;
	}
	
	//	gr: can't tell the difference between int and float, so err that wont work
	this.SetUniform = function(Uniform,Value)
	{
		if( Array.isArray(Value) )				this.SetUniformArray( Uniform, Value );
		else if ( Value instanceof TTexture )	this.SetUniformTexture( Uniform, Value, this.CurrentTextureIndex++ );
		else if ( Value instanceof float2 )		this.SetUniformFloat2( Uniform, Value );
		else if ( Value instanceof float3 )		this.SetUniformFloat3( Uniform, Value );
		else if ( Value instanceof float4 )		this.SetUniformFloat4( Uniform, Value );
		else if ( Value instanceof Matrix4x4 )	this.SetUniformMatrix4x4( Uniform, Value );
		else if ( typeof Value === 'number' )	this.SetUniformNumber( Uniform, Value );
		else
		{
			console.log(typeof Value);
			console.log(Value);
			throw "Failed to set uniform " +Uniform + " to " + ( typeof Value );
		}
	}
	
	this.SetUniformArray = function(UniformName,Values)
	{
		//	determine type of array, and length, and is array
		let UniformMeta = this.GetUniformMeta(UniformName);
		
		//	note: uniform iv may need to be Int32Array;
		//	https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
		//	enumerate the array
		let ValuesExpanded = [];
		let EnumValue = function(v)
		{
			if ( Array.isArray(v) )
				ValuesEnum.push(...v);
			else if ( typeof v == "object" )
				v.Enum( function(v)	{	ValuesExpanded.push(v);	} );
			else
				ValuesExpanded.push(v);
		};
		Values.forEach( EnumValue );
		
		//	check array size (allow less, but throw on overflow)
		//	error if array is empty
		while ( ValuesExpanded.length < UniformMeta.size )
			ValuesExpanded.push(0);
		/*
		if ( ValuesExpanded.length > UniformMeta.size )
			throw "Trying to put array of " + ValuesExpanded.length + " values into uniform " + UniformName + "[" + UniformMeta.size + "] ";
		*/
		UniformMeta.SetValues( ValuesExpanded );
	}
		
	this.SetUniformTexture = function(Uniform,Texture,TextureIndex)
	{
		let gl = this.GetGlContext();
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform );
		//  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
		//  WebGL provides a minimum of 8 texture units;
		let GlTextureNames = [ gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4, gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7 ];
		//	setup textures
		gl.activeTexture( GlTextureNames[TextureIndex] );
		try
		{
			gl.bindTexture(gl.TEXTURE_2D, Texture.Asset);
		}
		catch(e)
		{
			console.log("SetUniformTexture: " + e);
			//  todo: bind "invalid" texture
		}
		gl.uniform1i( UniformPtr, TextureIndex );
	}
	
	this.SetUniformNumber = function(Uniform,Value)
	{
		let gl = this.GetGlContext();
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		let UniformType = this.GetUniformType( Uniform );
		//	gr: this always returns 0 on imac12,2
		//let UniformType = gl.getUniform( this.Program, UniformPtr );
		
		switch ( UniformType )
		{
			case gl.INT:
			case gl.UNSIGNED_INT:
			case gl.BOOL:
				gl.uniform1i( UniformPtr, Value );
				break;
			case gl.FLOAT:
				gl.uniform1f( UniformPtr, Value );
				break;
			default:
				throw "Unhandled Number uniform type " + UniformType;
		}
	}

	this.SetUniformFloat2 = function(Uniform,Value)
	{
		let gl = this.GetGlContext();
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform2f( UniformPtr, Value.x, Value.y );
	}
	
	this.SetUniformFloat3 = function(Uniform,Value)
	{
		let gl = this.GetGlContext();
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform3f( UniformPtr, Value.x, Value.y, Value.z );
	}
	
	this.SetUniformFloat4 = function(Uniform,Value)
	{
		let gl = this.GetGlContext();
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform4f( UniformPtr, Value.x, Value.y, Value.z, Value.w );
	}

	this.SetUniformMatrix4x4 = function(Uniform,Value)
	{
		let gl = this.GetGlContext();
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		let float16 = Value.Values;
		let Transpose = false;
		//console.log(float16);
		gl.uniformMatrix4fv( UniformPtr, Transpose, float16 );
	}
	
	this.GetUniformType = function(UniformName)
	{
		let Meta = this.GetUniformMeta(UniformName);
		return Meta.type;
	}
	
	//	todo: cache this!
	this.GetUniformMeta = function(MatchUniformName)
	{
		let gl = this.GetGlContext();
		let UniformCount = gl.getProgramParameter( this.Program, gl.ACTIVE_UNIFORMS );
		for ( let i=0;	i<UniformCount;	i++ )
		{
			let UniformMeta = gl.getActiveUniform( this.Program, i );
			//	match name even if it's an array
			//	todo: struct support
			let UniformName = UniformMeta.name.split('[')[0];
			//	note: uniform consists of structs, Array[Length] etc
			if ( UniformName != MatchUniformName )
				continue;
			
			UniformMeta.Location = gl.getUniformLocation( this.Program, UniformMeta.name );
			switch( UniformMeta.type )
			{
				case gl.INT:
				case gl.UNSIGNED_INT:
				case gl.BOOL:
					UniformMeta.SetValues = function(v)	{	gl.uniform1iv( UniformMeta.Location, v );	};
					break;
				case gl.FLOAT:
					UniformMeta.SetValues = function(v)	{	gl.uniform1fv( UniformMeta.Location, v );	};
					break;
				case gl.FLOAT_VEC2:
					UniformMeta.SetValues = function(v)	{	gl.uniform2fv( UniformMeta.Location, v );	};
					break;
				case gl.FLOAT_VEC3:
					UniformMeta.SetValues = function(v)	{	gl.uniform3fv( UniformMeta.Location, v );	};
					break;
				case gl.FLOAT_VEC4:
					UniformMeta.SetValues = function(v)	{	gl.uniform4fv( UniformMeta.Location, v );	};
					break;

				default:
				case gl.FLOAT_MAT2:
				case gl.FLOAT_MAT3:
				case gl.FLOAT_MAT4:
					UniformMeta.SetValues = function(v)	{	throw "Unhandled type " + Uniform.type + " on " + MatchUniformName;	};
					break;
			}
			return UniformMeta;
		}
		throw "No uniform named " + MatchUniformName;
	}
	
	

	
	let gl = this.GetGlContext();
	this.FragShader = this.CompileShader( gl.FRAGMENT_SHADER, FragShaderSource );
	this.VertShader = this.CompileShader( gl.VERTEX_SHADER, VertShaderSource );
	this.Program = this.CompileProgram();
}
