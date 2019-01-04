Math = Math || {};

Math.Lerp = function(Min,Max,Value)
{
	return Min + ((Max-Min)*Value);
}
Math.Range = function(Min,Max,Value)
{
	return (Value-Min) / (Max-Min);
}
Math.Clamp = function(Min,Max,Value)
{
	return Math.max( Min, Math.min( Max, Value ) );
}
Math.Clamp01 = function(Value)
{
	return Math.Clamp(0,1,Value);
}
Math.Range01 = function(Min,Max,Value)
{
	return Math.Clamp01( Math.Range( Min, Max, Value ) );
}

Math.Length = function(x0,y0,x1,y1)
{
	let dx = x1-x0;
	let dy = y1-y0;
	let LengthSq = dx*dx + dy*dy;
	return Math.sqrt( LengthSq );
}

// Converts from degrees to radians.
Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
};

//	let hello = new float2(0,0)
function float2(x,y)
{
	this.x = x;
	this.y = y;
	
	this.Enum = function(Enum)
	{
		Enum(this.x);
		Enum(this.y);
	}
	
	//	swizzles
	this.xy = function()	{	return [this.x,this.y];	}
}

//	let hello = new float3(0,0,0)
function float3(x,y,z)
{
	this.x = x;
	this.y = y;
	this.z = z;
	
	this.Enum = function(Enum)
	{
		Enum(this.x);
		Enum(this.y);
		Enum(this.z);
	}
	
	//	swizzles
	this.xy = function()	{	return [this.x,this.y];	}
	this.xyz = function()	{	return [this.x,this.y,this.z];	}
}

function float4(x,y,z,w)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
	
	this.Set = function(x,y,z,w)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
	
	this.Enum = function(Enum)
	{
		Enum(this.x);
		Enum(this.y);
		Enum(this.z);
		Enum(this.w);
	}

	//	swizzles
	this.xy = function()	{	return [this.x,this.y];	}
	this.xyz = function()	{	return [this.x,this.y,this.z];	}
	this.xyzw = function()	{	return [this.x,this.y,this.z,this.w];	}
}

//	gr: put this somewhere better!
function GetFlipMatrix4x4()
{
	let Matrix =
	[
		1,0,0,0,
		0,-1,0,1,
		0,0,1,0,
		0,0,0,1
	];
	return new Matrix4x4(Matrix);
}


function Matrix4x4(Values)
{
	//	gr: Values is a float32array!
	this.Values = mat4.create();
	
	this.Invert = function()
	{
		let OldValues = mat4.clone(this.Values);
		mat4.invert( this.Values, OldValues );
	}
	
	this.GetInverse = function()
	{
		let Inverse = new Matrix4x4();
		mat4.invert( Inverse.Values, this.Values );
		return Inverse;
	}
	
	if ( Values === undefined )
	{
		
	}
	//	slightly hacky way to detect typed array that we can iterate
	//	https://stackoverflow.com/a/46999598/355753
	else if ( Array.isArray(Values) || Values.forEach !== undefined )
	{
		let This = this;
		let CopyValue = function(v,i)
		{
			This.Values[i] = v;
		};
		Values.forEach( CopyValue );
	}
	else if ( arguments.length == 4 )
	{
		//	assuming 4 rows
		for ( let r=0;	r<4;	r++ )
		{
			this.Values[(r*4)+0] = arguments[r].x;
			this.Values[(r*4)+1] = arguments[r].y;
			this.Values[(r*4)+2] = arguments[r].z;
			this.Values[(r*4)+3] = arguments[r].w;
		}
	}
	else
	{
		throw "Unhandled Values (" + typeof Values +") for matrix constructor";
	}
	
	this.GetArray = function()
	{
		return Array.from( this.Values );
	}
	this.Enum = function(Enum)
	{
		this.Values.forEach( Enum );
	}
}

//	wrapper for http://glmatrix.net/docs/module-quat.html
function Quaternion()
{
	//	gr: Values is a float32array!
	this.Values = quat.create();
	
	this.FromEular = function(PitchYawRollDegrees)
	{
		/*
		let Pitch = Math.radians(PitchYawRollDegrees.x);
		let Yaw = Math.radians(PitchYawRollDegrees.y);
		let Roll = Math.radians(PitchYawRollDegrees.z);
		quat.identity( this.Values );
		quat.rotateX( this.Values, this.Values, Pitch );
		quat.rotateY( this.Values, this.Values, Yaw );
		quat.rotateZ( this.Values, this.Values, Roll );
*/
		quat.fromEuler( this.Values, PitchYawRollDegrees.x, PitchYawRollDegrees.y, PitchYawRollDegrees.z );
	}
	
	this.FromAxisAngle = function(Axis3,Degrees)
	{
		let Radians = Math.radians( Degrees );
		quat.setAxisAngle( this.Values, Axis3, Radians );
	}
	
	this.Copy = function(That)
	{
		this.Values = quat.clone( That.Values );
	}
	
	this.Multiply = function(That)
	{
		let OldThis = quat.clone( this.Values );
		quat.multiply( this.Values, That.Values, OldThis );
	}
	
	this.GetMatrix4x4 = function()
	{
		let Matrix = new Matrix4x4();
		mat4.fromQuat( Matrix.Values, this.Values );
		return Matrix;
	}
	
	this.RotateX = function(Degrees)
	{
		let Radians = Math.radians(Degrees);
		quat.rotateX( this.Values, this.Values, Radians );
	}
	
	this.RotateY = function(Degrees)
	{
		let Radians = Math.radians(Degrees);
		quat.rotateY( this.Values, this.Values, Radians );
	}
	
	this.RotateZ = function(Degrees)
	{
		let Radians = Math.radians(Degrees);
		quat.rotateZ( this.Values, this.Values, Radians );
	}
}

