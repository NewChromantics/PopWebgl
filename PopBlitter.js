var PopGlBlitter =
{
	VertShader :
	`
	attribute vec2 PositionNorm;
	varying vec2 uv;
	void main()
	{
		vec2 Pos2 = mix( vec2(-1,-1), vec2(1,1), PositionNorm );
		gl_Position = vec4(Pos2, 0.0, 1.0);
		uv = vec2( PositionNorm.x, 1.0-PositionNorm.y);
		
		uv.x = mix( 0.0, 1.0, uv.x );
		uv.y = mix( 0.0, 1.0, uv.y );
	}
	`,
	
	AllocBlitGeometry : function()
	{
		let CanvasGeo = new TGeometry("Canvas");
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
		RenderGeo( this.Shader, PopGlBlitter.BlitGeometry, OnSetUniforms );
	}
}


function RenderGeo(Shader,Geo,OnSetUniforms)
{
	Shader.Bind();
	
	OnSetUniforms( Shader );
	
	//	setup buffer
	if ( Geo.Buffer == null )
	{
		//Geo.CreateBuffer();
		Geo.Buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, Geo.Buffer );
		
		//	all interleaved vertex data
		let Attrib = Geo.Attributes[0];
		let PositionUniform = gl.getAttribLocation( Shader.Program, Attrib.Uniform );
		//	gr: need to convert to array of floats...
		let VertexData = Geo.GetVertexData();
		gl.bufferData( gl.ARRAY_BUFFER, VertexData, gl.STATIC_DRAW );
		gl.enableVertexAttribArray( PositionUniform );
		let Normalised = false;
		let StrideBytes = 0;
		let OffsetBytes = 0;
		gl.vertexAttribPointer( PositionUniform, Attrib.Size, Attrib.Type, Normalised, StrideBytes, OffsetBytes );
		Geo.VertexCount = Attrib.Data.length;
	}
	
	let Attrib = Geo.Attributes[0];
	let PositionUniform = gl.getAttribLocation( Shader.Program, Attrib.Uniform );

	gl.bindBuffer( gl.ARRAY_BUFFER, Geo.Buffer );
	gl.enableVertexAttribArray( PositionUniform );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, Geo.VertexCount );
}


