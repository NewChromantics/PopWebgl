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

function Matrix4x4()
{
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
}

//	wrapper for http://glmatrix.net/docs/module-quat.html
function Quaternion()
{
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
}

