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

//	namespace
var PopGl =
{
	GetTypeAndSize : function(Type)
	{
		if ( typeof Type == "number" )	return { Type:gl.FLOAT, Size:1 };
		if ( Type instanceof float2 ) return { Type:gl.FLOAT, Size:2 };
		if ( Type instanceof float3 ) return { Type:gl.FLOAT, Size:3 };
		if ( Type instanceof float4 ) return { Type:gl.FLOAT, Size:4 };
		throw "Unhandled type " + Typename;
	},
	
};

//	global that needs some refactor
var gl = null;


function TContext(CanvasElement)
{
	this.Context = null;
	this.Canvas = CanvasElement;
	
	this.Context = CanvasElement.getContext("webgl");
	if ( !this.Context )
		throw "Failed to initialise webgl";

	this.Clear = function(Colour4)
	{
		let r = Colour4.x;
		let g = Colour4.y;
		let b = Colour4.z;
		let a = Colour4.w;
		gl.clearColor( r, g, b, a );
		gl.clear(gl.COLOR_BUFFER_BIT);
	}
	
	//	setup global var
	gl = this.Context;
}


//	let hello = new float2(0,0)
function float2(x,y)
{
	this.x = x;
	this.y = y;
}

//	let hello = new float3(0,0,0)
function float3(x,y,z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

function float4(x,y,z,w)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
}


function TAttribute(Uniform,Buffer)
{
	this.Uniform = Uniform;
	
	let TypeAndSize = PopGl.GetTypeAndSize(Buffer[0]);
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

function TGeometry(Name)
{
	this.Name = Name;
	this.Attributes = [];
	this.Buffer = null;		//	gl vertex buffer
	
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

function TTexture(Name,WidthOrUrl,Height)
{
	this.Name = Name;
	this.Asset = null;
	this.Width = 0;
	this.Height = 0;

	const TextureInitColour = [255, 0, 255, 255];
	
	this.GetWidth = function()	{	return this.Width;	}
	this.GetHeight = function()	{	return this.Height;	}

	this.CreateAsset = function()
	{
		this.Asset = gl.createTexture();
	}
	
	this.WritePixels = function(Width,Height,Pixels)
	{
		gl.bindTexture(gl.TEXTURE_2D, this.Asset );
		const level = 0;
		const internalFormat = gl.RGBA;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		
		if ( Pixels instanceof Image )
		{
			console.log(Pixels);
			this.Width = Pixels.width;
			this.Height = Pixels.height;
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,	srcFormat, srcType, Pixels);
		}
		else
		{
			this.Width = Width;
			this.Height = Height;
			//  if Pixels is Uint8Array
			const border = 0;
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, Width, Height, border, srcFormat, srcType, Pixels);
		}

		// WebGL1 has different requirements for power of 2 images
		// vs non power of 2 images so check if the image is a
		// power of 2 in both dimensions.
		// No, it's not a power of 2. Turn of mips and set
		// wrapping to clamp to edge
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}
	
	this.Load = function(Url)
	{
		//	init whilst we wait for load
		this.WritePixels( 1, 1, AllocPixelBuffer( 1, TextureInitColour ) );
		
		const image = new Image();
		image.crossOrigin = "anonymous";
		let This = this;
		image.onload = function()
		{
			This.WritePixels( 0, 0, image );
		};
		//  trigger load
		image.src = Url;
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
	else
	{
		//	defalt init
		this.CreateAsset();
		this.WritePixels( 1, 1, AllocPixelBuffer( 1, TextureInitColour ) );
	}
}

function TScreen(CanvasElement)
{
	this.CanvasElement = CanvasElement;
	
	this.GetWidth = function()
	{
		return this.CanvasElement.width;
	}
	
	this.GetHeight = function()
	{
		return this.CanvasElement.height;
	}
	
	//  unbind any frame buffer
	this.Bind = function()
	{
		gl.bindFramebuffer( gl.FRAMEBUFFER, null );
		gl.viewport(0, 0, this.GetWidth(), this.GetHeight() );
	}
}

function TRenderTarget(Name,Texture)
{
	this.Name = Name;
	this.FrameBuffer = null;
	this.Texture = null;
	
	this.CreateFrameBuffer = function(Texture)
	{
		console.log(gl);
		this.FrameBuffer = gl.createFramebuffer();
		this.Texture = Texture;
		
		this.Bind();
		
		//  attach this texture to colour output
		const level = 0;
		const attachmentPoint = gl.COLOR_ATTACHMENT0;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this.Texture.Asset, level);
	}
	
	//  bind for rendering
	this.Bind = function()
	{
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



function TShader(Name,VertShaderSource,FragShaderSource)
{
	this.Name = Name;
	this.VertShader = null;
	this.FragShader = null;
	this.Program = null;
	this.CurrentTextureIndex = 0;
	
	this.CompileShader = function(Type,Source)
	{
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
		gl.useProgram( this.Program );
		
		//	reset texture counter everytime we bind
		this.CurrentTextureIndex = 0;
	}
	
	//	gr: can't tell the difference between int and float, so err that wont work
	this.SetUniform = function(Uniform,Value)
	{
		if ( Value instanceof TTexture )		this.SetUniformTexture( Uniform, Value, this.CurrentTextureIndex++ );
		else if ( Value instanceof float2 )		this.SetUniformFloat2( Uniform, Value );
		else if ( Value instanceof float3 )		this.SetUniformFloat3( Uniform, Value );
		else if ( Value instanceof float4 )		this.SetUniformFloat4( Uniform, Value );
		else if ( typeof Value === 'number' )	this.SetUniformInt( Uniform, Value );
		else
		{
			throw "Failed to set uniform " +Uniform + " to " + ( typeof Value );
		}
	}
	
	this.SetUniformTexture = function(Uniform,Texture,TextureIndex)
	{
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
		catch
		{
			//  todo: bind "invalid" texture
		}
		gl.uniform1i(UniformPtr, TextureIndex );
	}
	
	this.SetUniformInt = function(Uniform,Value)
	{
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform1i( UniformPtr, Value );
	}
	
	this.SetUniformFloat = function(Uniform,Value)
	{
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform1f( UniformPtr, Value );
	}
	
	this.SetUniformFloat2 = function(Uniform,Value)
	{
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform2f( UniformPtr, Value.x, Value.y );
	}
	
	this.SetUniformFloat3 = function(Uniform,Value)
	{
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform3f( UniformPtr, Value.x, Value.y, Value.z );
	}
	
	this.SetUniformFloat4 = function(Uniform,Value)
	{
		let UniformPtr = gl.getUniformLocation( this.Program, Uniform);
		gl.uniform4f( UniformPtr, Value.x, Value.y, Value.z, Value.w );
	}

	
	this.FragShader = this.CompileShader( gl.FRAGMENT_SHADER, FragShaderSource );
	this.VertShader = this.CompileShader( gl.VERTEX_SHADER, VertShaderSource );
	this.Program = this.CompileProgram();
}
