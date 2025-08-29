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
- **Health checker**：http://localhost:8000/health

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
POST /api/v1/generate-prompt
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_input": "Pepe on the moon",
  "shape": "circle",
  "text_option": "no_text",
  "aspect_ratio": "1:1",
  "image_format": "png",
  "style_preference": "cyberpunk neon",
  "background_preference": "cosmic starfield"
}
```

#### Generate Prompt (Asynchronous)
```http
POST /api/v1/generate-prompt/async
Authorization: Bearer <token>
```

#### Get Task Status
```http
GET /api/v1/task/{task_id}
```

#### Parameter Options
```http
GET /api/v1/parameters/options
```

#### Usage Statistics
```http
GET /api/v1/stats
```

#### Health Check
```http
GET /api/v1/health
```

### Image Generation Endpoints

#### Generate Single Image
```http
POST /api/v1/images/generate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "A cute Shiba Inu meme character with diamond hands",
  "user_tier": "free",
  "shape": "circle",
  "aspect_ratio": "1:1",
  "image_format": "png",
  "negative_prompt": "blurry, low quality",
  "steps": 20,
  "cfg_scale": 7.0,
  "seed": 12345
}
```

#### Generate Multiple Images
```http
POST /api/v1/images/generate-multiple
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "A cute Shiba Inu meme character with diamond hands",
  "user_tier": "free",
  "count": 4,
  "shape": "circle",
  "aspect_ratio": "1:1",
  "image_format": "png",
  "negative_prompt": "blurry, low quality",
  "steps": 20,
  "cfg_scale": 7.0
}
```

## 🎨 Parameter Options

### Prompt Generation Parameters

#### Required Parameters
- **`user_input`** (string): User's meme concept input
  - Length: 1-200 characters
  - Description: The main concept or idea for the meme

#### Optional Parameters

##### Shape Type
- **`shape`** (string): Logo shape type
  - Options: `"circle"`, `"square"`, `"rectangle"`, `"hexagon"`, `"diamond"`, `"custom"`
  - Default: `"circle"`
  - Descriptions:
    - `circle` - Circular logo format, perfect for tokens
    - `square` - Square badge design, versatile format
    - `rectangle` - Rectangular banner style, good for headers
    - `hexagon` - Hexagonal emblem, modern tech feel
    - `diamond` - Diamond shaped logo, premium look
    - `custom` - Organic shape design, creative freedom

##### Text Options
- **`text_option`** (string): Text inclusion option
  - Options: `"no_text"`, `"with_text"`, `"minimal_text"`
  - Default: `"no_text"`
  - Descriptions:
    - `no_text` - Symbol only, no text elements
    - `with_text` - Include text elements in design
    - `minimal_text` - Subtle text integration

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

##### Shape Type
- **`shape`** (string): Image shape type
  - Options: `"circle"`, `"square"`, `"rectangle"`, `"hexagon"`, `"diamond"`, `"custom"`
  - Default: `"circle"`

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
  - Only for `/api/v1/images/generate-multiple` endpoint

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
curl -X POST "http://localhost:8000/api/v1/generate-prompt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "user_input": "Doge to the moon"
  }'
```

### Advanced Generation with Parameters
```bash
curl -X POST "http://localhost:8000/api/v1/generate-prompt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "user_input": "Cyber cat NFT",
    "shape": "hexagon",
    "text_option": "minimal_text",
    "aspect_ratio": "16:9",
    "image_format": "webp",
    "style_preference": "holographic vaporwave",
    "background_preference": "neon city skyline"
  }'
```

### Asynchronous Generation
```bash
# Start async task
curl -X POST "http://localhost:8000/api/v1/generate-prompt/async" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "user_input": "Space doge adventure"
  }'

# Check task status
curl "http://localhost:8000/api/v1/task/{task_id}"
```

### Get Parameter Options
```bash
curl "http://localhost:8000/api/v1/parameters/options"
```

### Image Generation

#### Generate Single Image
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "prompt": "A cute Shiba Inu meme character with diamond hands, cartoon style",
    "user_tier": "free",
    "shape": "circle",
    "aspect_ratio": "1:1",
    "image_format": "png",
    "steps": 20,
    "cfg_scale": 7.0
  }'
```

#### Generate Multiple Images
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate-multiple" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "prompt": "A cute Shiba Inu meme character with diamond hands, cartoon style",
    "user_tier": "free",
    "count": 3,
    "shape": "circle",
    "aspect_ratio": "1:1",
    "image_format": "png",
    "steps": 20,
    "cfg_scale": 7.0
  }'
```

#### Advanced Image Generation with All Parameters
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "prompt": "A futuristic robot cat with laser eyes, cyberpunk style",
    "user_tier": "dev",
    "shape": "hexagon",
    "aspect_ratio": "16:9",
    "image_format": "webp",
    "negative_prompt": "blurry, low quality, distorted, watermark",
    "steps": 30,
    "cfg_scale": 8.5,
    "seed": 42
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
GET /api/v1/stats
```

Provides insights into:
- Total prompts generated
- Popular parameter combinations
- Daily usage patterns
- Top user inputs
- Parameter popularity analytics

### Health Check
```http
GET /api/v1/health
```

Monitors:
- Redis connection status
- Kimi API availability
- Database connectivity
- Queue length
- System timestamp

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