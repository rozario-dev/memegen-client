# Meme Prompt Generator API

A powerful API for generating optimized prompts for meme coin logos, specifically designed for modern AI image generators like FLUX.1, Midjourney, DALL-E, and Ideogram.ai.

## 🚀 Features

- **Enhanced Parameter Control**: Shape, text options, and quality settings
- **Modern AI Optimization**: Prompts optimized for FLUX.1, Midjourney, DALL-E, Ideogram.ai
- **User Authentication**: Supabase-powered authentication system
- **Quota Management**: User-based quota system with subscription support
- **Async Processing**: Redis-powered task queue for scalable processing
- **Admin Dashboard**: Administrative controls for user and quota management
- **Real-time Generation**: Powered by Kimi AI for creative and contextual prompts
- **Usage Analytics**: Track popular parameters and generation patterns
- **CORS Support**: Configurable cross-origin resource sharing

## 🏗️ Architecture

- **FastAPI**: Modern Python web framework
- **Supabase**: Authentication and database backend
- **Redis**: Task queue and caching
- **PostgreSQL**: Primary database via Supabase
- **Docker**: Containerized deployment
- **Kimi AI**: Prompt generation engine

## Run the service

```bash
docker-compose up -d
```
This will run the app, redis, and postgres in the docker. But the postgres will link to supabase postgres. So you need to create a supabase project and get the postgres url from supabase dashboard.

### Service endpoint:

- **API**：http://localhost:8000
- **API docs**：http://localhost:8000/docs
- **Redis dashboard**：http://localhost:8081
- **Health checker**：http://localhost:8000/api/v1/health

## 📋 API Endpoints

### Authentication Endpoints

#### Get User Profile
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### Get User Quota
```http
GET /api/v1/auth/quota
Authorization: Bearer <token>
```

#### Get Quota Usage History
```http
GET /api/v1/auth/quota/usage
Authorization: Bearer <token>
```

#### Get Subscription Info
```http
GET /api/v1/auth/subscription
Authorization: Bearer <token>
```

### Admin Endpoints

#### Reset User Quota (Admin)
```http
POST /api/v1/auth/admin/quota/reset
Authorization: Bearer <admin_token>
```

#### Update User Quota (Admin)
```http
POST /api/v1/auth/admin/quota/update
Authorization: Bearer <admin_token>
```

#### Get User Info (Admin)
```http
POST /api/v1/auth/admin/user/info
Authorization: Bearer <admin_token>
```

### Core API Endpoints

#### Generate Prompt (Synchronous)
```http
POST /api/v1/images/generate-prompt
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_input": "Pepe on the moon",
  "aspect_ratio": "1:1",
  "image_format": "png",
  "style_preference": "cyberpunk neon",
  "background_preference": "cosmic starfield"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_input": "Pepe on the moon",
  "generated_prompt": "A cute Pepe frog character on lunar surface, cyberpunk neon style, cosmic starfield background, circular logo format, no text, transparent background, professional logo design",
  "parameters": {
    "aspect_ratio": "1:1",
    "image_format": "png",
    "style_preference": "cyberpunk neon",
    "background_preference": "cosmic starfield"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "status": "completed"
}
```

#### Generate Prompt (Asynchronous)
```http
POST /api/v1/images/generate-prompt/async
Authorization: Bearer <token>
```

#### Get Task Status
```http
GET /api/v1/images/task/{task_id}
```

#### Parameter Options
```http
GET /api/v1/images/parameters/options
```

#### Usage Statistics
```http
GET /api/v1/images/stats
```

#### Health Check
```http
GET /api/v1/health
```

## 📋 API Response Format

### Unified Response Structure

All image generation APIs (both prompt+image combined and direct image generation) return a consistent response format:

```json
{
  "prompt_id": "unique-prompt-identifier",
  "user_input": "original user input",
  "generated_prompt": "AI-generated or provided prompt",
  "images": [
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image.png",
      "image_uuid": "unique-image-identifier",
      "width": 1024,
      "height": 1024,
      "seed": 12345,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 3.2,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_images": 1,
  "user_tier": "free",
  "credits_consumed": 1,
  "remaining_credits": 99
}
```

**Key Points:**
- **Consistent Structure**: All endpoints return the same format for easy frontend integration
- **Image Array**: Even single image generation returns an array with one item
- **Per-Image Details**: Each image object contains complete generation metadata
- **Credit Information**: User tier, consumed credits, and remaining credits at the top level
- **Timing Data**: Individual generation time per image and total time for multiple images

### Combined Prompt + Image Generation Endpoints

#### Generate Multiple Images with Prompt (Synchronous)
```http
POST /api/v1/images/generate-combined-images
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_input": "Doge astronaut exploring Mars",
  "user_tier": "free",
  "count": 4,
  "aspect_ratio": "1:1",
  "image_format": "png",
  "style_preference": "3D rendered",
  "background_preference": "Mars landscape",
  "negative_prompt": "blurry, low quality",
  "steps": 20,
  "cfg_scale": 7.0
}
```

**Response:**
```json
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_input": "Doge astronaut exploring Mars",
  "generated_prompt": "A cute Doge astronaut character exploring Mars landscape, 3D rendered style, Mars landscape background, square badge design, minimal text integration, transparent background, professional logo design",
  "images": [
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_1.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440001",
      "width": 1024,
      "height": 1024,
      "seed": 2713998169,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 4.2,
      "created_at": "2024-01-15T10:35:00Z"
    },
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_2.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440002",
      "width": 1024,
      "height": 1024,
      "seed": 2060756168,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 4.5,
      "created_at": "2024-01-15T10:35:05Z"
    },
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_3.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440003",
      "width": 1024,
      "height": 1024,
      "seed": 1234567890,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 4.8,
      "created_at": "2024-01-15T10:35:10Z"
    },
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_4.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440004",
      "width": 1024,
      "height": 1024,
      "seed": 9876543210,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 5.1,
      "created_at": "2024-01-15T10:35:15Z"
    }
  ],
  "total_images": 4,
  "user_tier": "free",
  "credits_consumed": 4,
  "remaining_credits": 6
}
```

#### Generate Multiple Images with Prompt (Asynchronous)
```http
POST /api/v1/images/generate-combined-images/async
Authorization: Bearer <token>
```

**Request Body:** Same as synchronous multiple images generation

**Response:**
```json
{
  "task_id": "task_550e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "message": "Multiple images generation task created",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Parameters for Combined Endpoints:**
- **`user_input`** (required): User's meme concept input (1-200 characters)
- **`user_tier`** (optional): User tier for model selection (default: "free")
- **`count`** (optional, multiple images only): Number of images to generate (1-8, default: 4)
- **`style_preference`** (optional): Specific style preference (max 100 characters)
- **`background_preference`** (optional): Background preference (max 100 characters)
- **`negative_prompt`**, **`steps`**, **`cfg_scale`**, **`seed`**: Advanced parameters

### Image Generation Endpoints

#### Generate Multiple Images
```http
POST /api/v1/images/generate-images-from-prompt
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "A cute Shiba Inu meme character with diamond hands",
  "user_tier": "free",
  "count": 4,
  "aspect_ratio": "1:1",
  "image_format": "png",
  "negative_prompt": "blurry, low quality",
  "steps": 20,
  "cfg_scale": 7.0
}
```

**Response:**
```json
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_input": "A cute Shiba Inu meme character with diamond hands",
  "generated_prompt": "A cute Shiba Inu meme character with diamond hands",
  "images": [
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_1.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440001",
      "width": 1024,
      "height": 1024,
      "seed": 2713998169,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 4.2,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_2.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440002",
      "width": 1024,
      "height": 1024,
      "seed": 2060756168,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 4.5,
      "created_at": "2024-01-15T10:30:05Z"
    },
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_3.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440003",
      "width": 1024,
      "height": 1024,
      "seed": 1234567890,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 4.8,
      "created_at": "2024-01-15T10:30:10Z"
    },
    {
      "image_url": "https://runware-images.s3.amazonaws.com/image_4.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440004",
      "width": 1024,
      "height": 1024,
      "seed": 9876543210,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 5.1,
      "created_at": "2024-01-15T10:30:15Z"
    }
  ],
  "total_images": 4,
  "user_tier": "free",
  "credits_consumed": 4,
  "remaining_credits": 96
}
```

#### Modify Image (Image-to-Image)
```http
POST /api/v1/images/modify
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "Transform this image into a cyberpunk style meme character",
  "seed_image": "https://example.com/image.jpg",
  "user_tier": "free",
  "strength": 0.8,
  "aspect_ratio": "1:1",
  "image_format": "png",
  "negative_prompt": "blurry, low quality",
  "steps": 20,
  "cfg_scale": 7.0,
  "seed": 12345
}
```

**Response:**
```json
{
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_input": "Transform this image into a cyberpunk style meme character",
  "generated_prompt": "Transform this image into a cyberpunk style meme character",
  "images": [
    {
      "image_url": "https://runware-images.s3.amazonaws.com/modified_image.png",
      "image_uuid": "550e8400-e29b-41d4-a716-446655440000",
      "width": 1024,
      "height": 1024,
      "seed": 12345,
      "model": "runware:100@1",
      "model_name": "FLUX.1 schnell",
      "steps": 20,
      "cfg_scale": 7.0,
      "generation_time": 3.8,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_images": 1,
  "user_tier": "free",
  "credits_consumed": 1,
  "remaining_credits": 99
}
```

**Parameters:**
- **`prompt`** (required): Description of how to modify the image
- **`seed_image`** (required): URL or base64 encoded source image
- **`user_tier`** (optional): User tier affecting quality and cost (default: "free")
- **`strength`** (optional): Modification strength 0.1-1.0 (default: 0.8)
- **`negative_prompt`**, **`steps`**, **`cfg_scale`**, **`seed`**: Advanced parameters

## 🎨 Parameter Options

### Prompt Generation Parameters

#### Required Parameters
- **`user_input`** (string): User's meme concept input
  - Length: 1-200 characters
  - Description: The main concept or idea for the meme

#### Optional Parameters

##### Aspect Ratio
- **`aspect_ratio`** (string): Image aspect ratio
  - Options: `"1:1"`, `"21:9"`, `"16:9"`, `"4:3"`, `"3:2"`, `"2:3"`, `"3:4"`, `"9:16"`, `"9:21"`
  - Default: `"1:1"`
  - Descriptions:
    - `1:1` - Square format
    - `21:9` - Ultra-wide landscape
    - `16:9` - Wide landscape
    - `4:3` - Standard landscape
    - `3:2` - Classic landscape
    - `2:3` - Classic portrait
    - `3:4` - Standard portrait
    - `9:16` - Tall portrait
    - `9:21` - Ultra-tall portrait

##### Image Format
- **`image_format`** (string): Image output format
  - Options: `"png"`, `"jpg"`, `"webp"`
  - Default: `"png"`
  - Descriptions:
    - `png` - Supports transparency, larger file size
    - `jpg` - Smaller file size, no transparency
    - `webp` - Modern format, efficient compression

##### Style Preferences
- **`style_preference`** (string): Specific style preference
  - Length: Maximum 100 characters
  - Default: `null`
  - Description: Optional style guidance for the generated prompt

- **`background_preference`** (string): Background preference
  - Length: Maximum 100 characters
  - Default: `null`
  - Description: Optional background guidance for the generated prompt

### Image Generation Parameters

#### Required Parameters
- **`prompt`** (string): Image generation prompt text
  - Length: 1-1000 characters
  - Description: Text prompt for image generation

#### Optional Parameters

##### User Tier
- **`user_tier`** (string): User tier affecting image quality and credit consumption
  - Options: `"free"`, `"dev"`, `"pro"`, `"max"`
  - Default: `"free"`
  - Credit costs:
    - `free`: 1 credit per image (FLUX.1 schnell)
    - `dev`: 5 credits per image (HiDream-I1, FLUX.1 dev)
    - `pro`: 25 credits per image (Gemini Flash Image 2.5)
    - `max`: 40 credits per image (Ideogram 3.0)

##### Aspect Ratio
- **`aspect_ratio`** (string): Image aspect ratio
  - Options:
    - `"1:1"` - Square format
    - `"21:9"` - Ultra-wide landscape
    - `"16:9"` - Wide landscape
    - `"4:3"` - Standard landscape
    - `"3:2"` - Classic landscape
    - `"2:3"` - Classic portrait
    - `"3:4"` - Standard portrait
    - `"9:16"` - Tall portrait
    - `"9:21"` - Ultra-tall portrait
  - Default: `"1:1"`

##### Image Format
- **`image_format`** (string): Output image format
  - Options: `"png"`, `"jpg"`, `"webp"`
  - Default: `"png"`
  - Descriptions:
    - `png`: Supports transparency, larger file size
    - `jpg`: Smaller file size, no transparency
    - `webp`: Modern format, efficient compression

##### Advanced Parameters
- **`negative_prompt`** (string): Negative prompt to avoid certain content
  - Length: Maximum 500 characters
  - Default: `null`

- **`steps`** (integer): Generation steps affecting detail and time
  - Range: 10-50
  - Default: 20

- **`cfg_scale`** (float): Classifier-free guidance scale
  - Range: 1.0-20.0
  - Default: 7.0
  - Higher values = closer adherence to prompt

- **`seed`** (integer): Random seed for reproducible results
  - Default: `null` (random)
  - Only available for single image generation

##### Multiple Image Generation
- **`count`** (integer): Number of images to generate
  - Range: 1-8
  - Default: 4
  - Only for `/api/v1/images/generate-images-from-prompt` endpoint

## 🛠️ Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Supabase account
- Kimi AI API key
- Redis (included in Docker setup)

### Using Docker (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd meme-image-api

# Copy environment file
cp .env.example .env

# Edit .env with your settings
vim .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### Local Development
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Start Redis (if not using Docker)
redis-server

# Start the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Configuration

### Environment Variables

#### Kimi AI Configuration
```env
KIMI_API_KEY=your_kimi_api_key
KIMI_API_URL=https://api.moonshot.cn/v1/chat/completions
```

#### Supabase Configuration
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Supabase Database Direct Connection
SUPABASE_DB_HOST=aws-0-region.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.your_ref
SUPABASE_DB_PASSWORD=your_password
SUPABASE_POOL_MODE=transaction
```

#### Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

#### Redis Configuration
```env
REDIS_URL=redis://localhost:6379/0
```

#### Application Settings
```env
APP_NAME=Meme Prompt Generator API
APP_VERSION=2.0.0
DEBUG=False
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

#### Quota Settings
```env
DEFAULT_FREE_QUOTA=10
QUOTA_RESET_PERIOD=monthly
```

#### CORS Configuration
```env
CORS_ORIGINS=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Accept,Accept-Language,Content-Language,Content-Type,Authorization,X-Requested-With,Origin,X-CSRFToken,X-API-Key
CORS_CREDENTIALS=True
```

#### Admin Configuration
```env
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## 📊 Usage Examples

### Authentication
```bash
# Get user profile
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <your_token>"

# Check quota
curl -X GET "http://localhost:8000/api/v1/auth/quota" \
  -H "Authorization: Bearer <your_token>"
```

### Basic Generation
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate-prompt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "user_input": "Doge to the moon"
  }'
```

### Advanced Generation with Parameters
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate-prompt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "user_input": "Cyber cat NFT",
    "aspect_ratio": "16:9",
    "image_format": "webp",
    "style_preference": "holographic vaporwave",
    "background_preference": "neon city skyline"
  }'
```

### Asynchronous Generation
```bash
# Start async task
curl -X POST "http://localhost:8000/api/v1/images/generate-prompt/async" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "user_input": "Space doge adventure"
  }'

# Check task status
curl "http://localhost:8000/api/v1/images/task/{task_id}"
```

### Get Parameter Options
```bash
curl "http://localhost:8000/api/v1/images/parameters/options"
```

### Image Generation

#### Generate Multiple Images
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate-images-from-prompt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "prompt": "A cute Shiba Inu meme character with diamond hands, cartoon style",
    "user_tier": "free",
    "count": 3,
    "aspect_ratio": "1:1",
    "image_format": "png",
    "steps": 20,
    "cfg_scale": 7.0
  }'
```

## 🎯 AI Image Generator Compatibility

### Prompt Generation
The generated prompts are optimized for:

- **FLUX.1**: Advanced prompt structure with technical specifications
- **Midjourney**: Artistic style keywords and composition terms
- **DALL-E**: Clear subject-action-style format
- **Ideogram.ai**: Logo-specific formatting and quality indicators
- **Stable Diffusion**: Detailed technical parameters

### Direct Image Generation
The API provides direct image generation through Runware service with support for:

#### Available Models by User Tier

**FREE Tier (1 credit per image):**
- **FLUX.1 schnell**: Fast generation model for basic image creation

**DEV Tier (5 credits per image):**
- **HiDream-I1 Fast**: High-quality fast generation
- **FLUX.1 dev**: Development version with enhanced features
- **HiDream-I1 Dev**: Development model with advanced capabilities
- **Qwen Image**: Specialized image generation model
- **HiDream-I1 Full**: Full-featured model
- **FLUX.1 krea dev**: Creative development model

**PRO Tier (25 credits per image):**
- **Gemini Flash Image 2.5**: Google's advanced image generation model

**MAX Tier (40 credits per image):**
- **Ideogram 3.0**: Premium model for highest quality generation

#### Supported Features
- **Multiple Aspect Ratios**: From square (1:1) to ultra-wide (21:9) formats
- **Format Options**: PNG (with transparency), JPG, and WebP
- **Quality Control**: Adjustable steps (10-50) and CFG scale (1.0-20.0)
- **Batch Generation**: Generate up to 8 images simultaneously
- **Reproducible Results**: Seed support for consistent outputs
- **Negative Prompts**: Fine-tune generation by specifying what to avoid

## 📈 Analytics & Monitoring

### Usage Statistics
```http
GET /api/v1/images/stats
```

Provides insights into:
- Total prompts generated
- Popular parameter combinations
- Daily usage patterns
- Top user inputs
- Parameter popularity analytics

### Unified Health Check
```http
GET /api/v1/health
```

**Description:**
Unified health check endpoint that monitors all system services and provides comprehensive status information.

**Authentication:** Optional (more detailed information provided when authenticated)

**Response Example (Authenticated User):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "redis": "healthy",
    "kimi_api": "healthy",
    "database": "healthy",
    "queue_length": 5,
    "runware": "healthy"
  },
  "runware": {
    "status": "healthy",
    "connection_time": 0.15,
    "connected": true,
    "timestamp": "2024-01-20T10:30:00Z"
  },
  "connection_time": 0.25,
  "connected": true,
  "error": null
}
```

**Response Example (Unauthenticated User):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "redis": "healthy",
    "kimi_api": "healthy",
    "database": "healthy",
    "queue_length": 5
  },
  "runware": null,
  "connection_time": 0.25,
  "connected": true,
  "error": null
}
```

**Monitors:**
- Redis connection status and queue length
- Kimi API configuration and availability
- Database connectivity
- Runware service status (detailed info for authenticated users)
- Overall system connectivity
- Response times and connection performance
- System timestamp and version

**Status Values:**
- `healthy`: All services are functioning normally
- `degraded`: Some non-critical services have issues
- `unhealthy`: Critical services are failing

### Redis Management
Access Redis Commander at `http://localhost:8081` for:
- Queue monitoring
- Task status tracking
- Cache management
- Performance metrics

## 🚀 Deployment

### Production Deployment
```bash
# Production environment
cp .env.example .env.prod
# Edit production settings

# Deploy with production config
docker-compose -f docker-compose.yml up -d

# Scale services
docker-compose up -d --scale app=3
```

### Performance Optimization
- Redis caching for frequently used prompts
- Connection pooling for database via Supabase Pooler
- Async processing with Redis queue
- Rate limiting via quota system
- CORS optimization for web clients

### Monitoring
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f redis

# Monitor Redis
docker-compose logs -f redis-commander
```

## 🔐 Security

- **JWT Authentication**: Supabase-powered secure authentication
- **Admin Controls**: Role-based access for administrative functions
- **Quota Management**: Prevents abuse through usage limits
- **CORS Configuration**: Secure cross-origin resource sharing
- **Environment Variables**: Sensitive data protection
- **Database Security**: Supabase RLS (Row Level Security)

## 📝 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Root Endpoint**: `http://localhost:8000/` (API overview)

## 🧪 Testing

```bash
# Get JWT token from supabase authorization
python3 -m scripts.auth_user --email your@email.com --password yourpassword
```
Then you can use this token to call the API.


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the health check endpoint `/api/v1/health`
- Monitor logs via `docker-compose logs`

## 🔄 Version History

- **v2.0.0**: Enhanced with authentication, quota management, async processing, and admin controls
- **v1.0.0**: Initial release with basic prompt generation

---

**Version 2.0** - Enhanced with Supabase authentication, Redis task queue, quota management, and comprehensive admin controls for production-ready deployment.