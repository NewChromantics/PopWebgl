var PopGlBlitter =
{
	VertShader :
	`
	attribute vec2 PositionNorm;
	varying vec2 uv;
	uniform vec4 VertexRect;	//	no defaults in es glsl = vec4(0,0,1,1);
	void main()
	{
		gl_Position = vec4(PositionNorm.x,PositionNorm.y,0,1);
		float l = VertexRect[0];
		float t = VertexRect[1];
		float r = l+VertexRect[2];
		float b = t+VertexRect[3];
		l = mix( -1.0, 1.0, l );
		r = mix( -1.0, 1.0, r );
		t = mix( 1.0, -1.0, t );
		b = mix( 1.0, -1.0, b );
		gl_Position.x = mix( l, r, PositionNorm.x );
		gl_Position.y = mix( t, b, PositionNorm.y );
		uv = vec2( PositionNorm.x, PositionNorm.y );
	}
	`,
	
	AllocBlitGeometry : function()
	{
		let CanvasGeo = new TGeometry("Canvas",gl.TRIANGLE_STRIP);
		let Uvs = [
				   new float2( 0, 0 ),
				   new float2( 1, 0 ),
				   new float2( 0, 1 ),
				   new float2( 1, 1 ),
				   ];
		CanvasGeo.AddAttribute( new TAttribute("PositionNorm", Uvs ) );
		return CanvasGeo;
	},
	
	BlitGeometry : null,
	
	Init : function()
	{
		if ( PopGlBlitter.BlitGeometry == null )
			PopGlBlitter.BlitGeometry = PopGlBlitter.AllocBlitGeometry();
	}
};


function TBlitter(Name,FragShader)
{
	PopGlBlitter.Init();

	this.Shader = new TShader( Name, PopGlBlitter.VertShader, FragShader );
	
	this.Render = function(Target,OnSetUniforms)
	{
		Target.Bind();
		let SetUniforms = function(Shader)
		{
			//	default
			Shader.SetUniform("VertexRect", new float4(0,0,1,1) );
			OnSetUniforms(arguments);
		}
		RenderGeo( this.Shader, PopGlBlitter.BlitGeometry, SetUniforms );
	}
}


function RenderGeo(Shader,Geo,OnSetUniforms,RenderTarget)
{
	Shader.Bind();
	
	OnSetUniforms( Shader, Geo, RenderTarget );
	
	//	setup buffer
	if ( Geo.Buffer == null )
	{
		//Geo.CreateBuffer();
		Geo.Buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, Geo.Buffer );
		
		//	all interleaved vertex data
		let Attrib = Geo.Attributes[0];
		let PositionUniform = gl.getAttribLocation( Shader.Program, Attrib.Uniform );
		if ( PositionUniform == -1 )
			throw "Shader does not have a uniform named " + Attrib.Uniform + " (compiled out?)";
		//	gr: need to convert to array of floats...
		let VertexData = Geo.GetVertexData();
		gl.bufferData( gl.ARRAY_BUFFER, VertexData, gl.STATIC_DRAW );
		gl.enableVertexAttribArray( PositionUniform );
		let Normalised = false;
		let StrideBytes = 0;
		let OffsetBytes = 0;
		gl.vertexAttribPointer( PositionUniform, Attrib.Size, Attrib.Type, Normalised, StrideBytes, OffsetBytes );

		Geo.IndexCount = Attrib.Data.length;
	}
	
	let Attrib = Geo.Attributes[0];
	let PositionUniform = gl.getAttribLocation( Shader.Program, Attrib.Uniform );

	gl.bindBuffer( gl.ARRAY_BUFFER, Geo.Buffer );
	gl.enableVertexAttribArray( PositionUniform );
	gl.drawArrays( Geo.PrimitiveType, 0, Geo.IndexCount );
}


