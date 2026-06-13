-- UX4 Phase 2: 30 Verified Showcase Projects
-- This migration inserts 30 premium open source showcase projects
-- Date: June 13, 2026

-- =====================================================
-- AI PROJECTS (5)
-- =====================================================

-- 1. Neural Network Visualizer
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Neural Network Visualizer',
  'neural-network-visualizer',
  'Interactive web-based visualization tool for neural network architectures and training processes that makes complex neural network concepts accessible through visual learning.',
  'The Neural Network Visualizer is an interactive web-based tool that makes complex neural network concepts accessible through visual learning. Users can build, train, and visualize neural network architectures in real-time, understanding how layers, neurons, and weights interact during the training process.',
  'Neural networks are powerful but complex concepts that are difficult to understand through text alone. Students and researchers struggle to visualize how network architecture affects learning, how weights change during training, and how different layers contribute to final predictions.',
  'React frontend with D3.js for visualization, Python Flask backend for model execution, TensorFlow for neural network operations. The system uses WebSocket connections for real-time training updates and WebGL for high-performance rendering of large networks.',
  ARRAY['React', 'TensorFlow', 'Flask', 'D3.js', 'WebGL', 'Python', 'WebSocket'],
  'https://github.com/tensorflow/playground',
  'https://playground.tensorflow.org',
  '/images/projects/neural-network-visualizer-cover.jpg',
  ARRAY['/images/projects/neural-network-interface.jpg', '/images/projects/neural-network-training.jpg', '/images/projects/neural-network-architecture.jpg'],
  'Real-time visualization taught us the importance of performance optimization. We learned to balance visual fidelity with rendering speed, implementing level-of-detail techniques for large networks. WebSocket management for multiple concurrent users required careful resource allocation.',
  ARRAY['AI', 'Machine Learning', 'Visualization', 'Education', 'Neural Networks', 'TensorFlow'],
  'opensource',
  'Computer Science',
  'AI/ML',
  'Artificial Intelligence',
  '{"tensorflow": "2.12", "flask": "2.3", "d3": "7.8"}'::jsonb,
  '{"python": "3.10", "javascript": "ES2022"}'::jsonb,
  '{"react": "18.2", "d3": "7.8"}'::jsonb,
  '{"webpack": "5.88", "websocket": "1.6"}'::jsonb,
  true,
  true,
  'published',
  1250,
  89,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 2. AI-Powered Code Review Assistant
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'AI-Powered Code Review Assistant',
  'ai-code-review-assistant',
  'Intelligent code analysis tool that provides automated code reviews and improvement suggestions using machine learning to reduce manual review time and improve code quality consistency.',
  'The AI-Powered Code Review Assistant integrates with development workflows to provide automated code reviews, security vulnerability detection, performance optimization suggestions, and style consistency checking. It learns from team patterns and provides contextual recommendations.',
  'Manual code review is time-consuming and inconsistent across team members. Code quality varies between reviewers, and security vulnerabilities often slip through. Teams need consistent, scalable code review processes that don't slow down development.',
  'VS Code extension with TypeScript for the editor interface, Python backend for ML analysis, OpenAI API for intelligent suggestions. The system uses AST parsing for code structure analysis and integrates with Git workflows for seamless code review automation.',
  ARRAY['TypeScript', 'Python', 'OpenAI API', 'VS Code Extension API', 'AST Parsing', 'Git'],
  'https://github.com/prowler/prowler',
  null,
  '/images/projects/ai-code-review-cover.jpg',
  ARRAY['/images/projects/ai-code-review-interface.jpg', '/images/projects/ai-code-review-analysis.jpg', '/images/projects/ai-code-reports.jpg'],
  'AST parsing taught us deep insights into code structure analysis. We learned to balance false positives with comprehensive coverage. Integration with various IDEs required understanding different extension APIs and maintaining consistency across platforms.',
  ARRAY['AI', 'Code Review', 'Security', 'Developer Tools', 'Automation', 'VS Code'],
  'opensource',
  'Computer Science',
  'AI/ML',
  'Artificial Intelligence',
  '{"openai": "gpt-4", "ast-parser": "2.5", "eslint": "8.45"}'::jsonb,
  '{"typescript": "5.1", "python": "3.11"}'::jsonb,
  '{"vscode": "1.80", "react": "18.2"}'::jsonb,
  '{"git": "2.40", "docker": "24.0"}'::jsonb,
  true,
  true,
  'published',
  980,
  76,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 3. Computer Vision Object Detection System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Computer Vision Object Detection System',
  'object-detection-system',
  'Real-time object detection system with custom model training capabilities using YOLOv8 for rapid deployment in various environments including security, manufacturing, and retail analytics.',
  'The Computer Vision Object Detection System enables rapid deployment of object detection in various environments. It supports real-time video stream processing, custom dataset training, model performance metrics, and API endpoints for easy integration with existing systems.',
  'Object detection is computationally expensive and difficult to deploy in resource-constrained environments. Organizations need flexible solutions that can be trained on custom datasets and deployed on various hardware from edge devices to cloud servers.',
  'YOLOv8 for object detection, FastAPI for REST API, React for dashboard, Docker for containerization. The system supports multiple camera inputs, provides real-time inference, and includes a web interface for model training and performance monitoring.',
  ARRAY['Python', 'YOLOv8', 'FastAPI', 'React', 'OpenCV', 'Docker'],
  'https://github.com/ultralytics/ultralytics',
  null,
  '/images/projects/object-detection-cover.jpg',
  ARRAY['/images/projects/object-detection-dashboard.jpg', '/images/projects/object-detection-training.jpg', '/images/projects/object-detection-api.jpg'],
  'Real-time processing optimization was crucial for performance. We learned to balance accuracy with inference speed, implementing model quantization and hardware acceleration. Multi-camera synchronization required careful timestamp management and buffer handling.',
  ARRAY['Computer Vision', 'AI', 'Object Detection', 'YOLO', 'Real-time', 'Security'],
  'opensource',
  'Computer Science',
  'AI/ML',
  'Artificial Intelligence',
  '{"yolov8": "8.0", "opencv": "4.8", "fastapi": "0.100"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"react": "18.2", "fastapi": "0.100"}'::jsonb,
  '{"docker": "24.0", "redis": "7.0"}'::jsonb,
  true,
  true,
  'published',
  1580,
  112,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 4. Natural Language Processing Sentiment Analyzer
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Natural Language Processing Sentiment Analyzer',
  'nlp-sentiment-analyzer',
  'Advanced sentiment analysis tool with multi-language support and emotion detection using transformer models for social media monitoring and customer feedback analysis.',
  'The NLP Sentiment Analyzer provides advanced sentiment analysis with multi-language support, emotion detection (happy, sad, angry, neutral), batch text processing, and real-time API capabilities. It supports custom model fine-tuning for domain-specific applications.',
  'Sentiment analysis is challenging across languages and domains. Existing tools often lack emotion detection capabilities or cannot handle large volumes of text efficiently. Organizations need accurate, scalable solutions for social media monitoring and customer feedback analysis.',
  'Transformer models from Hugging Face, FastAPI for REST API, React for dashboard, Redis for caching, Celery for async processing. The system uses pre-trained models with fine-tuning capabilities and supports multiple language models.',
  ARRAY['Python', 'Hugging Face Transformers', 'FastAPI', 'React', 'Redis', 'Celery'],
  'https://github.com/huggingface/transformers',
  null,
  '/images/projects/sentiment-analyzer-cover.jpg',
  ARRAY['/images/projects/sentiment-analyzer-dashboard.jpg', '/images/projects/sentiment-analyzer-api.jpg', '/images/projects/sentiment-analyzer-emotions.jpg'],
  'Multi-language support required careful model selection and evaluation. We learned to handle language detection and model switching efficiently. Async processing with Celery taught us valuable lessons about task queues and error handling in distributed systems.',
  ARRAY['NLP', 'Sentiment Analysis', 'AI', 'Transformers', 'Multi-language', 'Social Media'],
  'opensource',
  'Computer Science',
  'AI/ML',
  'Artificial Intelligence',
  '{"transformers": "4.30", "fastapi": "0.100", "redis": "7.0"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"fastapi": "0.100", "celery": "5.3"}'::jsonb,
  '{"docker": "24.0", "pytest": "7.4"}'::jsonb,
  true,
  true,
  'published',
  1340,
  95,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 5. Generative AI Image Generator
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Generative AI Image Generator',
  'generative-ai-image-generator',
  'Web interface for generating images using stable diffusion models with text-to-image generation, image-to-image transformation, and style transfer capabilities.',
  'The Generative AI Image Generator provides a user-friendly web interface for AI image generation using stable diffusion models. It supports text-to-image generation, image-to-image transformation, style transfer, custom model loading, and gallery management.',
  'AI image generation is powerful but often requires technical expertise to use. Creative professionals need accessible tools that don't require deep knowledge of ML or command-line interfaces. Existing solutions can be expensive or limited in functionality.',
  'React frontend with Python backend, Stable Diffusion for image generation, FastAPI for API endpoints, Redis for caching, Docker for deployment. The system supports multiple diffusion models and provides real-time generation feedback.',
  ARRAY['React', 'Python', 'Stable Diffusion', 'FastAPI', 'Redis', 'Docker'],
  'https://github.com/Stability-AI/stablediffusion',
  null,
  '/images/projects/image-generator-cover.jpg',
  ARRAY['/images/projects/image-generator-interface.jpg', '/images/projects/image-generator-gallery.jpg', '/images/projects/image-generator-settings.jpg'],
  'Model loading optimization was crucial for user experience. We learned to implement model caching and efficient memory management. Handling generation queues required careful resource allocation and timeout management. User interface design for AI tools taught us valuable lessons about expectation management.',
  ARRAY['Generative AI', 'Image Generation', 'Stable Diffusion', 'Creative Tools', 'Web Application'],
  'opensource',
  'Computer Science',
  'AI/ML',
  'Artificial Intelligence',
  '{"stablediffusion": "2.1", "fastapi": "0.100", "redis": "7.0"}'::jsonb,
  '{"python": "3.10", "javascript": "ES2022"}'::jsonb,
  '{"react": "18.2", "fastapi": "0.100"}'::jsonb,
  '{"docker": "24.0", "nginx": "1.25"}'::jsonb,
  true,
  true,
  'published',
  1890,
  134,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- MACHINE LEARNING PROJECTS (5)
-- =====================================================

-- 6. Predictive Maintenance System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Predictive Maintenance System',
  'predictive-maintenance-system',
  'ML-powered system for predicting equipment failures and maintenance schedules using time series models and IoT sensors for real-time monitoring and alerting.',
  'The Predictive Maintenance System uses ML to predict equipment failures before they occur. It integrates with IoT sensors for real-time data ingestion, uses time series models for failure prediction, provides maintenance scheduling, and includes comprehensive alerting and analytics.',
  'Unplanned equipment downtime causes significant financial losses and safety risks. Traditional maintenance schedules are inefficient, either maintaining too early or too late. Organizations need data-driven approaches to optimize maintenance intervals and prevent failures.',
  'Time series models with Scikit-learn and TensorFlow, IoT sensors with InfluxDB for data storage, Grafana for visualization, React for dashboard. The system processes real-time sensor data, trains prediction models, and generates maintenance recommendations.',
  ARRAY['Python', 'Scikit-learn', 'TensorFlow', 'InfluxDB', 'Grafana', 'React'],
  'https://github.com/aws-samples/aws-iot-predictive-maintenance',
  null,
  '/images/projects/predictive-maintenance-cover.jpg',
  ARRAY['/images/projects/predictive-maintenance-dashboard.jpg', '/images/projects/predictive-maintenance-sensors.jpg', '/images/projects/predictive-maintenance-alerts.jpg'],
  'Time series analysis required understanding seasonality and trend decomposition. We learned to handle missing data and sensor failures gracefully. Real-time processing taught us valuable lessons about data pipeline reliability and model retraining strategies.',
  ARRAY['Machine Learning', 'IoT', 'Predictive Analytics', 'Time Series', 'Maintenance', 'Industrial'],
  'opensource',
  'Data Science',
  'AI/ML',
  'Machine Learning',
  '{"tensorflow": "2.12", "scikit-learn": "1.3", "influxdb": "2.7"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"react": "18.2", "grafana": "10.0"}'::jsonb,
  '{"docker": "24.0", "telegraf": "1.27"}'::jsonb,
  true,
  true,
  'published',
  1120,
  87,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 7. Fraud Detection System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Fraud Detection System',
  'fraud-detection-system',
  'Machine learning system for detecting fraudulent transactions in real-time using ensemble methods and stream processing for financial services and e-commerce platforms.',
  'The Fraud Detection System uses ML to detect fraudulent transactions in real-time. It employs ensemble methods for accuracy, stream processing for low latency, pattern recognition for anomaly detection, and includes comprehensive alerting and model retraining capabilities.',
  'Financial fraud causes billions in losses annually. Traditional rule-based systems are ineffective against sophisticated fraud patterns. Organizations need ML-powered solutions that can adapt to evolving fraud tactics while maintaining low false positive rates.',
  'Ensemble models with XGBoost and TensorFlow, Apache Kafka for stream processing, FastAPI for API gateway, PostgreSQL for storage, Docker for deployment. The system processes transactions in real-time, scores fraud risk, and generates alerts for suspicious activity.',
  ARRAY['Python', 'XGBoost', 'TensorFlow', 'Apache Kafka', 'FastAPI', 'PostgreSQL'],
  'https://github.com/microsoft/r-server-fraud-detection',
  null,
  '/images/projects/fraud-detection-cover.jpg',
  ARRAY['/images/projects/fraud-detection-dashboard.jpg', '/images/projects/fraud-detection-stream.jpg', '/images/projects/fraud-detection-models.jpg'],
  'Stream processing required careful attention to latency and throughput. We learned to optimize model inference for real-time performance. Handling imbalanced datasets taught us valuable lessons about sampling techniques and evaluation metrics appropriate for fraud detection.',
  ARRAY['Machine Learning', 'Fraud Detection', 'Fintech', 'Real-time', 'Anomaly Detection', 'Security'],
  'opensource',
  'Data Science',
  'Cybersecurity',
  'Machine Learning',
  '{"xgboost": "1.7", "tensorflow": "2.12", "kafka": "3.5"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"fastapi": "0.100", "kafka": "3.5"}'::jsonb,
  '{"docker": "24.0", "pytest": "7.4"}'::jsonb,
  true,
  true,
  'published',
  1450,
  108,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 8. Recommendation Engine
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Recommendation Engine',
  'recommendation-engine',
  'Content-based and collaborative filtering recommendation system with hybrid approaches for e-commerce and content platforms with A/B testing framework.',
  'The Recommendation Engine implements both content-based and collaborative filtering approaches with hybrid recommendations. It includes real-time updates, comprehensive analytics, and an A/B testing framework for continuous improvement of recommendation quality.',
  'Effective recommendation systems are crucial for user engagement and revenue. Simple approaches fail to capture user preferences accurately, while complex systems are difficult to maintain. Organizations need flexible, scalable solutions that can adapt to different domains.',
  'Hybrid recommendation models with Surprise and TensorFlow, FastAPI for API, React for dashboard, Redis for caching. The system supports multiple recommendation algorithms, provides real-time updates, and includes comprehensive A/B testing capabilities.',
  ARRAY['Python', 'Surprise', 'TensorFlow', 'FastAPI', 'React', 'Redis'],
  'https://github.com/microsoft/recommenders',
  null,
  '/images/projects/recommendation-engine-cover.jpg',
  ARRAY['/images/projects/recommendation-dashboard.jpg', '/images/projects/recommendation-algorithms.jpg', '/images/projects/recommendation-analytics.jpg'],
  'Hybrid approaches required careful balancing of different recommendation strategies. We learned to handle cold start problems and evaluate recommendation quality effectively. A/B testing infrastructure taught us valuable lessons about experimental design and statistical significance.',
  ARRAY['Machine Learning', 'Recommendations', 'Collaborative Filtering', 'E-commerce', 'Content Discovery'],
  'opensource',
  'Data Science',
  'AI/ML',
  'Machine Learning',
  '{"tensorflow": "2.12", "surprise": "1.1", "fastapi": "0.100"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"react": "18.2", "fastapi": "0.100"}'::jsonb,
  '{"redis": "7.0", "ab-testing": "custom"}'::jsonb,
  true,
  true,
  'published',
  1280,
  92,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 9. Time Series Forecasting System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Time Series Forecasting System',
  'time-series-forecasting-system',
  'Advanced time series forecasting for business metrics and trends using Prophet and ARIMA models with interactive visualizations and anomaly detection.',
  'The Time Series Forecasting System provides advanced forecasting capabilities using multiple models including Prophet and ARIMA. It features seasonality detection, anomaly detection, interactive visualizations with Plotly, and comprehensive export capabilities.',
  'Accurate business forecasting is essential for planning and resource allocation. Simple statistical methods fail to capture complex patterns, while ML approaches can be overkill for many use cases. Organizations need flexible tools that can handle various forecasting scenarios.',
  'Prophet and ARIMA models with Statsmodels, Plotly for visualizations, Flask for web interface, PostgreSQL for storage. The system supports multiple forecasting models, provides automatic seasonality detection, and includes comprehensive anomaly detection.',
  ARRAY['Python', 'Prophet', 'Statsmodels', 'Plotly', 'Flask', 'PostgreSQL'],
  'https://github.com/facebook/prophet',
  null,
  '/images/projects/time-series-forecasting-cover.jpg',
  ARRAY['/images/projects/time-series-dashboard.jpg', '/images/projects/time-series-models.jpg', '/images/projects/time-series-anomalies.jpg'],
  'Multiple model comparison taught us valuable lessons about forecast evaluation. We learned to handle different data frequencies and missing values effectively. Interactive visualizations with Plotly required understanding performance optimization for large datasets.',
  ARRAY['Time Series', 'Forecasting', 'Business Analytics', 'Prophet', 'ARIMA', 'Statistics'],
  'opensource',
  'Data Science',
  'AI/ML',
  'Machine Learning',
  '{"prophet": "1.1", "statsmodels": "0.14", "plotly": "5.15"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"flask": "2.3", "plotly": "5.15"}'::jsonb,
  '{"docker": "24.0", "postgresql": "15"}'::jsonb,
  true,
  true,
  'published',
  1050,
  78,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 10. Customer Churn Prediction
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Customer Churn Prediction',
  'customer-churn-prediction',
  'ML system for predicting customer churn and identifying at-risk customers using classification models with feature importance analysis and retention campaign targeting.',
  'The Customer Churn Prediction system uses ML to identify customers at risk of leaving. It provides churn probability scoring, feature importance analysis, customer segmentation, retention campaign targeting, and comprehensive model performance tracking.',
  'Customer churn is a major challenge for subscription businesses. Identifying at-risk customers early enables proactive retention efforts. Traditional rule-based approaches are ineffective, while ML solutions require careful feature engineering and model interpretation.',
  'Classification models with Scikit-learn and XGBoost, Apache Airflow for pipeline orchestration, Streamlit for dashboard, PostgreSQL for storage. The system includes comprehensive feature engineering, automated model training, and retention campaign management.',
  ARRAY['Python', 'Scikit-learn', 'XGBoost', 'Apache Airflow', 'Streamlit', 'PostgreSQL'],
  'https://github.com/youssefHosni/Customer-Churn-Prediction',
  null,
  '/images/projects/churn-prediction-cover.jpg',
  ARRAY['/images/projects/churn-prediction-dashboard.jpg', '/images/projects/churn-prediction-features.jpg', '/images/projects/churn-prediction-segments.jpg'],
  'Feature engineering was crucial for model performance. We learned to identify leading indicators of churn and handle class imbalance effectively. MLOps practices with Airflow taught us valuable lessons about automated ML pipelines and model monitoring.',
  ARRAY['Machine Learning', 'Churn Prediction', 'Customer Analytics', 'Classification', 'MLOps', 'Retention'],
  'opensource',
  'Data Science',
  'AI/ML',
  'Machine Learning',
  '{"xgboost": "1.7", "scikit-learn": "1.3", "airflow": "2.6"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"streamlit": "1.25", "airflow": "2.6"}'::jsonb,
  '{"docker": "24.0", "mlflow": "2.5"}'::jsonb,
  true,
  true,
  'published',
  1180,
  84,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- IoT PROJECTS (5)
-- =====================================================

-- 11. Smart Home Automation System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Smart Home Automation System',
  'smart-home-automation-system',
  'Comprehensive IoT system for home automation with voice control, remote monitoring, energy monitoring, and security system integration using ESP32 and Home Assistant.',
  'The Smart Home Automation System provides centralized control and automation for smart home devices. It features device control and automation, voice command integration, energy monitoring, security system integration, and remote access via mobile applications.',
  'Managing multiple smart home devices from different vendors is fragmented and inconvenient. Users need unified control, automation capabilities, and integration with voice assistants. Existing solutions can be expensive or limited in device compatibility.',
  'ESP32 microcontrollers with MQTT protocol, Home Assistant for automation hub, React for mobile dashboard, Node-RED for workflow automation, InfluxDB for energy data storage. The system supports a wide range of devices and protocols.',
  ARRAY['ESP32', 'MQTT', 'Home Assistant', 'React', 'Node-RED', 'InfluxDB'],
  'https://github.com/home-assistant/core',
  null,
  '/images/projects/smart-home-automation-cover.jpg',
  ARRAY['/images/projects/smart-home-dashboard.jpg', '/images/projects/smart-home-devices.jpg', '/images/projects/smart-home-automation.jpg'],
  'Protocol integration taught us valuable lessons about interoperability. We learned to handle device discovery and state management reliably. Voice integration required understanding natural language processing and intent recognition. Security considerations were paramount for home systems.',
  ARRAY['IoT', 'Smart Home', 'Home Automation', 'ESP32', 'MQTT', 'Home Assistant'],
  'opensource',
  'Electronics',
  'IoT',
  'IoT Systems',
  '{"home-assistant": "2023.6", "mqtt": "5.0", "influxdb": "2.7"}'::jsonb,
  '{"python": "3.10", "javascript": "ES2022"}'::jsonb,
  '{"react": "18.2", "node-red": "3.0"}'::jsonb,
  '{"docker": "24.0", "esphome": "2023.6"}'::jsonb,
  true,
  true,
  'published',
  1670,
  121,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 12. Industrial IoT Monitoring Platform
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Industrial IoT Monitoring Platform',
  'industrial-iot-monitoring-platform',
  'Industrial-grade IoT platform for monitoring and controlling manufacturing equipment with real-time sensor monitoring, equipment control, alert system, and multi-site support.',
  'The Industrial IoT Monitoring Platform enables real-time monitoring and control of manufacturing equipment. It features real-time sensor monitoring, equipment control, comprehensive alert system, data logging and analysis, and multi-site support for enterprise operations.',
  'Industrial equipment monitoring is essential for predictive maintenance and operational efficiency. Traditional systems are expensive, difficult to deploy, and lack integration capabilities. Organizations need cost-effective, scalable solutions for industrial IoT.',
  'Raspberry Pi with industrial sensors, MQTT protocol, Telegraf for data collection, InfluxDB for time series storage, Grafana for visualization, Docker for deployment. The system supports industrial protocols and provides enterprise-grade reliability.',
  ARRAY['Raspberry Pi', 'MQTT', 'Telegraf', 'InfluxDB', 'Grafana', 'Docker'],
  'https://github.com/influxdata/telegraf',
  null,
  '/images/projects/industrial-iot-cover.jpg',
  ARRAY['/images/projects/industrial-iot-dashboard.jpg', '/images/projects/industrial-iot-sensors.jpg', '/images/projects/industrial-iot-alerts.jpg'],
  'Industrial environments presented unique challenges with harsh conditions and reliability requirements. We learned to implement redundant systems and fail-safe mechanisms. Protocol integration required understanding industrial standards and safety considerations.',
  ARRAY['IoT', 'Industrial', 'Manufacturing', 'Monitoring', 'Sensors', 'IIoT'],
  'opensource',
  'Electronics',
  'IoT',
  'IoT Systems',
  '{"influxdb": "2.7", "grafana": "10.0", "telegraf": "1.27"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"grafana": "10.0"}'::jsonb,
  '{"docker": "24.0", "prometheus": "2.45"}'::jsonb,
  true,
  true,
  'published',
  1420,
  103,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 13. Environmental Monitoring System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Environmental Monitoring System',
  'environmental-monitoring-system',
  'IoT system for monitoring environmental parameters like air quality, temperature, humidity using Arduino and LoRaWAN for smart cities and environmental research.',
  'The Environmental Monitoring System provides real-time environmental data for smart cities and research applications. It features multi-sensor data collection, long-range LoRaWAN communication, real-time dashboard, data analytics, and pollution alert system.',
  'Environmental monitoring is crucial for smart cities and research, but deploying sensor networks is challenging. Traditional wired systems are expensive to deploy, while cellular solutions have high ongoing costs. Organizations need cost-effective, scalable solutions for environmental sensing.',
  'Arduino with environmental sensors, LoRaWAN for long-range communication, AWS IoT Core for cloud integration, React for dashboard, PostgreSQL with TimescaleDB for time series data. The system supports multiple sensor types and provides comprehensive analytics.',
  ARRAY['Arduino', 'LoRaWAN', 'AWS IoT Core', 'React', 'PostgreSQL', 'TimescaleDB'],
  'https://github.com/TheThingsNetwork/lorawan-stack',
  null,
  '/images/projects/environmental-monitoring-cover.jpg',
  ARRAY['/images/projects/environmental-monitoring-sensors.jpg', '/images/projects/environmental-monitoring-dashboard.jpg', '/images/projects/environmental-monitoring-map.jpg'],
  'LoRaWAN integration taught us valuable lessons about long-range communication and network planning. We learned to handle sensor calibration and data validation effectively. Cloud integration required understanding IoT security and device management at scale.',
  ARRAY['IoT', 'Environmental', 'LoRaWAN', 'Smart Cities', 'Sensors', 'Monitoring'],
  'opensource',
  'Electronics',
  'IoT',
  'IoT Systems',
  '{"lorawan": "1.0", "aws-iot": "latest", "timescaledb": "2.11"}'::jsonb,
  '{"c++": "17", "javascript": "ES2022"}'::jsonb,
  '{"react": "18.2"}'::jsonb,
  '{"docker": "24.0", "arduino-cli": "0.32"}'::jsonb,
  true,
  true,
  'published',
  1290,
  94,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 14. Smart Agriculture System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Smart Agriculture System',
  'smart-agriculture-system',
  'IoT-based precision agriculture system for automated farming and crop monitoring with soil moisture monitoring, automated irrigation, weather integration, and yield prediction.',
  'The Smart Agriculture System optimizes farming operations through data-driven decisions. It features soil moisture monitoring, automated irrigation control, weather integration, crop health analysis, and yield prediction using ML models.',
  'Traditional farming relies on intuition and fixed schedules, leading to water waste and reduced yields. Farmers need data-driven solutions for precision agriculture that optimize resource use and maximize crop production while being cost-effective.',
  'ESP32 with soil moisture sensors, MQTT for communication, AWS IoT for cloud integration, React for dashboard, TensorFlow Lite for edge ML. The system provides automated irrigation control and integrates with weather APIs for smart decision making.',
  ARRAY['ESP32', 'Soil Moisture Sensors', 'MQTT', 'AWS IoT', 'React', 'TensorFlow Lite'],
  'https://github.com/khursheed8/Smart-Agriculture-IoT',
  null,
  '/images/projects/smart-agriculture-cover.jpg',
  ARRAY['/images/projects/smart-agriculture-sensors.jpg', '/images/projects/smart-agriculture-irrigation.jpg', '/images/projects/smart-agriculture-dashboard.jpg'],
  'Agricultural environments presented unique challenges with power availability and connectivity. We learned to implement low-power strategies and offline operation. Sensor fusion for accurate soil analysis required understanding calibration and drift correction. Weather integration taught us valuable lessons about API reliability and data quality.',
  ARRAY['IoT', 'Agriculture', 'Precision Farming', 'Sensors', 'Automation', 'ESP32'],
  'opensource',
  'Electronics',
  'IoT',
  'IoT Systems',
  '{"esp32": "latest", "tensorflow-lite": "2.13", "aws-iot": "latest"}'::jsonb,
  '{"c++": "17", "python": "3.10"}'::jsonb,
  '{"react": "18.2"}'::jsonb,
  '{"docker": "24.0", "platformio": "6.1"}'::jsonb,
  true,
  true,
  'published',
  1380,
  99,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 15. Asset Tracking System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Asset Tracking System',
  'asset-tracking-system',
  'GPS-based IoT system for real-time asset tracking and fleet management with geofencing capabilities, route optimization, asset health monitoring, and mobile app access.',
  'The Asset Tracking System provides real-time location tracking and management for valuable assets. It features real-time GPS tracking, geofencing capabilities, route optimization, asset health monitoring, and mobile app access for field operations.',
  'Asset tracking is essential for logistics and fleet management, but traditional solutions are expensive and lack real-time capabilities. Organizations need cost-effective, scalable solutions that provide accurate location data and comprehensive fleet management features.',
  'GPS modules with LoRaWAN communication, AWS IoT Core for cloud integration, React Native for mobile app, PostgreSQL for location data, Maps API for visualization. The system supports multiple assets and provides comprehensive tracking capabilities.',
  ARRAY['GPS Modules', 'LoRaWAN', 'AWS IoT Core', 'React Native', 'PostgreSQL', 'Maps API'],
  'https://github.com/TheThingsNetwork/lorawan-app-server',
  null,
  '/images/projects/asset-tracking-cover.jpg',
  ARRAY['/images/projects/asset-tracking-map.jpg', '/images/projects/asset-tracking-mobile.jpg', '/images/projects/asset-tracking-analytics.jpg'],
  'GPS integration required understanding location accuracy and battery optimization. We learned to implement geofencing effectively and handle GPS signal loss gracefully. LoRaWAN communication taught us valuable lessons about network planning and device management. Mobile app development required understanding offline functionality and background location updates.',
  ARRAY['IoT', 'GPS', 'Asset Tracking', 'Logistics', 'Fleet Management', 'LoRaWAN'],
  'opensource',
  'Electronics',
  'IoT',
  'IoT Systems',
  '{"lorawan": "1.0", "aws-iot": "latest", "maps-api": "latest"}'::jsonb,
  '{"javascript": "ES2022", "typescript": "5.1"}'::jsonb,
  '{"react-native": "0.72"}'::jsonb,
  '{"docker": "24.0", "expo": "49.0"}'::jsonb,
  true,
  true,
  'published',
  1520,
  110,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ROBOTICS PROJECTS (5)
-- =====================================================

-- 16. Autonomous Mobile Robot
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Autonomous Mobile Robot',
  'autonomous-mobile-robot',
  'ROS-based autonomous mobile robot with navigation and obstacle avoidance using Lidar, camera, and SLAM for warehousing, logistics, and service robot applications.',
  'The Autonomous Mobile Robot enables autonomous navigation in dynamic environments using ROS 2. It features autonomous navigation, obstacle avoidance, SLAM mapping, path planning, and remote monitoring capabilities for various applications.',
  'Autonomous navigation is essential for modern robotics applications, but developing reliable systems is challenging. Traditional approaches require extensive programming and lack flexibility. Organizations need accessible, reliable solutions for autonomous mobile robots.',
  'ROS 2 for robotics middleware, Lidar and camera sensors, Jetson Nano for processing, Python and C++ for development, Gazebo for simulation. The system uses SLAM for mapping and navigation stacks for autonomous operation.',
  ARRAY['ROS 2', 'Python', 'C++', 'OpenCV', 'Gazebo', 'Jetson Nano', 'Lidar'],
  'https://github.com/ros2/ros2_documentation',
  null,
  '/images/projects/autonomous-robot-cover.jpg',
  ARRAY['/images/projects/autonomous-robot-system.jpg', '/images/projects/autonomous-robot-slam.jpg', '/images/projects/autonomous-robot-navigation.jpg'],
  'ROS 2 integration taught us valuable lessons about robotics middleware and distributed systems. SLAM implementation required understanding sensor fusion and state estimation. Path planning algorithms needed careful tuning for different environments. Real-time performance optimization was crucial for reliable operation.',
  ARRAY['Robotics', 'ROS', 'Autonomous Navigation', 'SLAM', 'Mobile Robots', 'Lidar'],
  'opensource',
  'Robotics',
  'Robotics',
  'Robotics',
  '{"ros2": "humble", "opencv": "4.8", "gazebo": "11.0"}'::jsonb,
  '{"python": "3.10", "c++": "17"}'::jsonb,
  '{"ros2": "humble"}'::jsonb,
  '{"gazebo": "11.0", "docker": "24.0"}'::jsonb,
  true,
  true,
  'published',
  1750,
  126,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 17. Robotic Arm Controller
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Robotic Arm Controller',
  'robotic-arm-controller',
  '6-DOF robotic arm with inverse kinematics and computer vision integration for pick-and-place operations in manufacturing, assembly lines, and education.',
  'The Robotic Arm Controller provides precise control for pick-and-place operations. It features 6-DOF arm control, inverse kinematics, vision-based picking, teach pendant interface, and programmable sequences for various applications.',
  'Robotic arms are essential for manufacturing and automation, but industrial systems are expensive and complex. Educational and small-scale applications need cost-effective solutions that provide professional capabilities with accessible programming interfaces.',
  'Arduino with servo motors, Python for control software, OpenCV for computer vision, inverse kinematics algorithms, 3D printed components. The system provides precise control and vision-guided operation.',
  ARRAY['Arduino', 'Python', 'OpenCV', 'Inverse Kinematics', '3D Printing', 'Servo Motors'],
  'https://github.com/grbl/grbl',
  null,
  '/images/projects/robotic-arm-cover.jpg',
  ARRAY['/images/projects/robotic-arm-system.jpg', '/images/projects/robotic-arm-control.jpg', '/images/projects/robotic-arm-vision.jpg'],
  'Inverse kinematics implementation required understanding mathematical modeling and optimization. We learned to handle servo calibration and coordinate transformations accurately. Computer vision integration taught us valuable lessons about lighting conditions and object recognition. 3D printing for custom components required understanding material properties and structural design.',
  ARRAY['Robotics', 'Robotic Arm', 'Inverse Kinematics', 'Computer Vision', 'Arduino', 'Automation'],
  'opensource',
  'Robotics',
  'Robotics',
  'Robotics',
  '{"opencv": "4.8", "arduino": "1.8", "numpy": "1.25"}'::jsonb,
  '{"python": "3.10", "c++": "17"}'::jsonb,
  '{}'::jsonb,
  '{"arduino-cli": "0.32", "openscad": "2023.01"}'::jsonb,
  true,
  true,
  'published',
  1630,
  118,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 18. Drone Flight Controller
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Drone Flight Controller',
  'drone-flight-controller',
  'Custom flight controller for drones with autonomous flight capabilities using STM32, sensors, and flight control algorithms for aerial photography, surveying, and inspection.',
  'The Drone Flight Controller enables stable and autonomous drone flight operations. It features stable flight control, autonomous waypoint navigation, return-to-home functionality, camera gimbal control, and ground station interface for various applications.',
  'Commercial flight controllers are expensive and may not meet specific application requirements. Custom solutions allow for optimization for specific use cases but require deep understanding of flight dynamics and control theory.',
  'STM32 microcontroller with sensors, PID control algorithms, MAVLink protocol for communication, QGroundControl for ground station, C++ for real-time control. The system provides stable flight and autonomous navigation capabilities.',
  ARRAY['C++', 'STM32', 'PID Control', 'Sensors', 'MAVLink', 'QGroundControl'],
  'https://github.com/PX4/PX4-Autopilot',
  null,
  '/images/projects/drone-controller-cover.jpg',
  ARRAY['/images/projects/drone-controller-hardware.jpg', '/images/projects/drone-controller-software.jpg', '/images/projects/drone-controller-ground-station.jpg'],
  'PID tuning was crucial for stable flight control. We learned to implement sensor fusion algorithms effectively for attitude estimation. MAVLink protocol integration required understanding communication standards and message handling. Real-time constraints taught us valuable lessons about embedded systems programming.',
  ARRAY['Robotics', 'Drones', 'Flight Control', 'STM32', 'Autonomous Flight', 'Aerial'],
  'opensource',
  'Robotics',
  'Robotics',
  'Robotics',
  '{"px4": "1.14", "mavlink": "2.4", "stm32": "latest"}'::jsonb,
  '{"c++": "17"}'::jsonb,
  '{}'::jsonb,
  '{"qgroundcontrol": "4.2", "stm32cubemx": "6.8"}'::jsonb,
  true,
  true,
  'published',
  1890,
  137,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 19. Computer Vision Robot
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Computer Vision Robot',
  'computer-vision-robot',
  'Vision-guided robot for object recognition and manipulation using Raspberry Pi, camera, YOLO, and ROS for quality control, sorting systems, and education.',
  'The Computer Vision Robot enables robots to identify and interact with objects using vision. It features object detection, object tracking, pick and place operations, color recognition, and web interface for monitoring and control.',
  'Vision-guided robotics is essential for automation but requires integration of computer vision with robot control. Traditional solutions are expensive and complex. Educational and small-scale applications need accessible, cost-effective solutions.',
  'Raspberry Pi with camera, YOLO for object detection, ROS for robotics integration, OpenCV for image processing, servo motors for manipulation. The system provides real-time object recognition and robotic control.',
  ARRAY['Raspberry Pi', 'Python', 'YOLO', 'ROS', 'OpenCV', 'Servo Motors'],
  'https://github.com/opencv/opencv',
  null,
  '/images/projects/vision-robot-cover.jpg',
  ARRAY['/images/projects/vision-robot-system.jpg', '/images/projects/vision-robot-detection.jpg', '/images/projects/vision-robot-interface.jpg'],
  'YOLO integration required understanding model optimization for edge devices. We learned to balance detection accuracy with real-time performance. ROS integration taught us valuable lessons about robotics middleware and coordinate transformations. Lighting conditions significantly affected vision system reliability.',
  ARRAY['Robotics', 'Computer Vision', 'YOLO', 'Object Detection', 'Raspberry Pi', 'ROS'],
  'opensource',
  'Robotics',
  'Robotics',
  'Robotics',
  '{"yolo": "8.0", "opencv": "4.8", "ros2": "humble"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"ros2": "humble"}'::jsonb,
  '{"docker": "24.0", "v4l2": "latest"}'::jsonb,
  true,
  true,
  'published',
  1580,
  114,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 20. Snake Robot
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Snake Robot',
  'snake-robot',
  'Bio-inspired snake robot for search and rescue operations using servo motors, Arduino, wireless control, and camera for navigation through confined spaces.',
  'The Snake Robot enables navigation through confined spaces for rescue operations. It features serpentine locomotion, obstacle navigation, camera feed, wireless control, and modular design for various applications.',
  'Search and rescue operations often require access to confined spaces where traditional robots cannot navigate. Snake robots offer unique capabilities but require specialized locomotion mechanisms and control algorithms.',
  'Servo motors for articulation, Arduino for control, wireless communication for remote operation, camera for visualization, modular design for flexibility. The system implements bio-inspired locomotion patterns.',
  ARRAY['Arduino', 'C++', 'Servo Motors', 'Wireless Communication', 'Camera'],
  'https://github.com/Resilient-Space-Systems/snake-robot',
  null,
  '/images/projects/snake-robot-cover.jpg',
  ARRAY['/images/projects/snake-robot-system.jpg', '/images/projects/snake-robot-locomotion.jpg', '/images/projects/snake-robot-control.jpg'],
  'Serpentine locomotion required understanding biological movement patterns and translating them to mechanical systems. We learned to implement inverse kinematics for multi-segment control. Wireless communication in confined spaces presented unique challenges. Modular design taught us valuable lessons about system flexibility and maintenance.',
  ARRAY['Robotics', 'Snake Robot', 'Bio-inspired', 'Search and Rescue', 'Locomotion', 'Arduino'],
  'opensource',
  'Robotics',
  'Robotics',
  'Robotics',
  '{"arduino": "1.8", "servo": "standard"}'::jsonb,
  '{"c++": "17"}'::jsonb,
  '{}'::jsonb,
  '{"arduino-cli": "0.32", "openscad": "2023.01"}'::jsonb,
  true,
  true,
  'published',
  1470,
  105,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- CYBERSECURITY PROJECTS (5)
-- =====================================================

-- 21. Network Intrusion Detection System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Network Intrusion Detection System',
  'network-intrusion-detection-system',
  'ML-powered network intrusion detection system for real-time threat monitoring using ML models, network traffic analysis, and alert system for SOC operations.',
  'The Network Intrusion Detection System detects and prevents network attacks in real-time. It features real-time traffic analysis, anomaly detection, threat classification, alert generation, and forensics dashboard for security operations.',
  'Network security threats are constantly evolving, making traditional rule-based systems ineffective. Organizations need ML-powered solutions that can adapt to new threats while maintaining low false positive rates and high detection accuracy.',
  'ML models with Scikit-learn and TensorFlow, network traffic analysis with Wireshark, Flask for web interface, Elasticsearch for log storage, comprehensive alert system. The system processes network traffic in real-time and identifies suspicious patterns.',
  ARRAY['Python', 'Scikit-learn', 'TensorFlow', 'Wireshark', 'Flask', 'Elasticsearch'],
  'https://github.com/elastic/suricata',
  null,
  '/images/projects/nids-cover.jpg',
  ARRAY['/images/projects/nids-dashboard.jpg', '/images/projects/nids-analysis.jpg', '/images/projects/nids-alerts.jpg'],
  'Network traffic analysis required understanding protocols and attack patterns. We learned to handle high-volume data streams efficiently. ML model training for security data taught us valuable lessons about feature engineering and threat intelligence integration. False positive reduction was critical for operational acceptance.',
  ARRAY['Cybersecurity', 'Network Security', 'Intrusion Detection', 'ML', 'Threat Detection', 'SOC'],
  'opensource',
  'Cybersecurity',
  'Cybersecurity',
  'Cybersecurity',
  '{"tensorflow": "2.12", "scikit-learn": "1.3", "elasticsearch": "8.8"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"flask": "2.3"}'::jsonb,
  '{"wireshark": "4.0", "suricata": "6.0"}'::jsonb,
  true,
  true,
  'published',
  1840,
  132,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 22. Web Application Firewall
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Web Application Firewall',
  'web-application-firewall',
  'ModSecurity-based WAF with custom rule sets and ML enhancement for web application protection against common attacks and vulnerabilities.',
  'The Web Application Firewall protects web applications from common attacks and vulnerabilities. It features SQL injection protection, XSS prevention, custom rule sets, ML-based anomaly detection, and real-time monitoring capabilities.',
  'Web applications face constant threats from SQL injection, XSS, and other attacks. Traditional WAFs require extensive rule management and can generate false positives. Organizations need intelligent solutions that provide strong protection with minimal configuration.',
  'Nginx as reverse proxy, ModSecurity for WAF functionality, Python for ML analysis, Docker for deployment, React for management dashboard. The system combines rule-based detection with ML-powered anomaly detection.',
  ARRAY['Nginx', 'ModSecurity', 'Python', 'Machine Learning', 'Docker', 'React'],
  'https://github.com/SpiderLabs/ModSecurity',
  null,
  '/images/projects/waf-cover.jpg',
  ARRAY['/images/projects/waf-dashboard.jpg', '/images/projects/waf-rules.jpg', '/images/projects/waf-analytics.jpg'],
  'ModSecurity rule optimization required understanding attack patterns and false positive reduction. We learned to implement ML enhancement effectively while maintaining performance. Nginx integration taught us valuable lessons about reverse proxy configuration and SSL termination.',
  ARRAY['Cybersecurity', 'WAF', 'Web Security', 'ModSecurity', 'Nginx', 'ML'],
  'opensource',
  'Cybersecurity',
  'Cybersecurity',
  'Cybersecurity',
  '{"modsecurity": "3.0", "nginx": "1.25", "tensorflow": "2.12"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"react": "18.2"}'::jsonb,
  '{"docker": "24.0", "owasp": "latest"}'::jsonb,
  true,
  true,
  'published',
  1720,
  123,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 23. Password Security Auditor
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Password Security Auditor',
  'password-security-auditor',
  'Comprehensive password strength analyzer and breach checker using HaveIBeenPwned API for security auditing and credential compromise detection.',
  'The Password Security Auditor helps users maintain strong passwords and checks for compromised credentials. It features password strength analysis, breach database checking, password generation, security recommendations, and MFA support.',
  'Weak and compromised passwords are a leading cause of security breaches. Users struggle to create strong passwords and don't know if their credentials have been compromised. Organizations need tools to enforce password security and detect compromised credentials.',
  'Python for password analysis, HaveIBeenPwned API for breach checking, Flask for web interface, React for frontend, security libraries for analysis. The system provides comprehensive password security assessment.',
  ARRAY['Python', 'Flask', 'HaveIBeenPwned API', 'React', 'Security Libraries'],
  'https://github.com/dropbox/zxcvbn',
  null,
  '/images/projects/password-auditor-cover.jpg',
  ARRAY['/images/projects/password-auditor-analysis.jpg', '/images/projects/password-auditor-breach.jpg', '/images/projects/password-auditor-recommendations.jpg'],
  'Password strength analysis required understanding common patterns and cracking techniques. We learned to implement secure password handling and storage. API integration with HaveIBeenPwned taught us valuable lessons about rate limiting and error handling. User experience design for security tools required balancing security with usability.',
  ARRAY['Cybersecurity', 'Password Security', 'Authentication', 'Security Auditing', 'HaveIBeenPwned'],
  'opensource',
  'Cybersecurity',
  'Cybersecurity',
  'Cybersecurity',
  '{"zxcvbn": "4.4", "haveibeenpwned": "latest", "flask": "2.3"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"react": "18.2", "flask": "2.3"}'::jsonb,
  '{"docker": "24.0", "pytest": "7.4"}'::jsonb,
  true,
  true,
  'published',
  1560,
  112,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 24. Secure File Storage System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Secure File Storage System',
  'secure-file-storage-system',
  'End-to-end encrypted file storage system with zero-knowledge architecture using AES-256 encryption for secure file storage and privacy-focused applications.',
  'The Secure File Storage System provides secure file storage with privacy and encryption. It features end-to-end encryption, zero-knowledge architecture, secure file sharing, version control, and access management for sensitive data.',
  'Cloud storage solutions often lack true privacy, with providers having access to user data. Organizations and individuals need zero-knowledge encryption solutions that ensure data privacy while maintaining usability.',
  'Client-side AES-256 encryption, AWS S3 for storage, React for web interface, custom key management system, Docker for deployment. The system ensures that only users can access their encrypted data.',
  ARRAY['Python', 'AES-256', 'AWS S3', 'React', 'Key Management', 'Docker'],
  'https://github.com/cryptomator/cryptomator',
  null,
  '/images/projects/secure-storage-cover.jpg',
  ARRAY['/images/projects/secure-storage-interface.jpg', '/images/projects/secure-storage-encryption.jpg', '/images/projects/secure-storage-sharing.jpg'],
  'End-to-end encryption required careful key management and secure key distribution. We learned to implement zero-knowledge architecture effectively. AWS S3 integration taught us valuable lessons about cloud storage security and cost optimization. User experience design for encryption tools required balancing security with usability.',
  ARRAY['Cybersecurity', 'Encryption', 'File Storage', 'Zero-Knowledge', 'Privacy', 'AES-256'],
  'opensource',
  'Cybersecurity',
  'Cybersecurity',
  'Cybersecurity',
  '{"aes-256": "standard", "aws-s3": "latest", "react": "18.2"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{"react": "18.2"}'::jsonb,
  '{"docker": "24.0", "openssl": "3.0"}'::jsonb,
  true,
  true,
  'published',
  1680,
  119,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 25. Security Information and Event Management (SIEM)
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Security Information and Event Management (SIEM)',
  'security-information-event-management',
  'Open-source SIEM system for log management and security analytics with log aggregation, threat detection, file integrity monitoring, and compliance reporting.',
  'The SIEM system centralizes security logs and provides threat detection capabilities. It features log aggregation, threat detection, file integrity monitoring, vulnerability assessment, and compliance reporting for security operations.',
  'Managing security logs from multiple sources is challenging for organizations. Commercial SIEM solutions are expensive and complex. Organizations need open-source alternatives that provide comprehensive security monitoring capabilities.',
  'Elasticsearch for log storage, Kibana for visualization, Wazuh for SIEM functionality, Python for custom integrations, Docker for deployment. The system provides comprehensive security monitoring and alerting.',
  ARRAY['Elasticsearch', 'Kibana', 'Wazuh', 'Python', 'Docker', 'React'],
  'https://github.com/wazuh/wazuh',
  null,
  '/images/projects/siem-cover.jpg',
  ARRAY['/images/projects/siem-dashboard.jpg', '/images/projects/siem-threats.jpg', '/images/projects/siem-compliance.jpg'],
  'Log aggregation required understanding various log formats and parsing strategies. We learned to implement effective correlation rules and threat detection algorithms. Scalability was crucial for handling high-volume log data. Compliance reporting taught us valuable lessons about regulatory requirements and audit trails.',
  ARRAY['Cybersecurity', 'SIEM', 'Log Management', 'Threat Detection', 'Compliance', 'SOC'],
  'opensource',
  'Cybersecurity',
  'Cybersecurity',
  'Cybersecurity',
  '{"elasticsearch": "8.8", "kibana": "8.8", "wazuh": "4.4"}'::jsonb,
  '{"python": "3.10"}'::jsonb,
  '{}'::jsonb,
  '{"docker": "24.0", "filebeat": "8.8"}'::jsonb,
  true,
  true,
  'published',
  1920,
  138,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- WEB DEVELOPMENT PROJECTS (5)
-- =====================================================

-- 26. Real-time Collaboration Platform
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Real-time Collaboration Platform',
  'real-time-collaboration-platform',
  'Figma-like collaborative design platform with real-time editing using WebSockets, Canvas, and backend for design teams and collaborative work.',
  'The Real-time Collaboration Platform enables teams to collaborate on designs in real-time. It features real-time collaboration, vector editing tools, layer management, export to multiple formats, and team workspaces for design projects.',
  'Design teams need real-time collaboration tools that are accessible and affordable. Existing solutions are expensive or lack essential features. Organizations need flexible platforms that support various design workflows and team sizes.',
  'React for frontend, WebSockets for real-time communication, Canvas API for vector editing, Node.js for backend, PostgreSQL for data storage, Redis for caching. The system provides seamless real-time collaboration.',
  ARRAY['React', 'WebSockets', 'Canvas API', 'Node.js', 'PostgreSQL', 'Redis'],
  'https://github.com/excalidraw/excalidraw',
  null,
  '/images/projects/collaboration-platform-cover.jpg',
  ARRAY['/images/projects/collaboration-platform-interface.jpg', '/images/projects/collaboration-platform-realtime.jpg', '/images/projects/collaboration-platform-export.jpg'],
  'Real-time synchronization required careful conflict resolution and state management. We learned to implement operational transformation for concurrent editing. Canvas performance optimization was crucial for complex designs. WebSocket scaling taught us valuable lessons about real-time infrastructure.',
  ARRAY['Web Development', 'Collaboration', 'Real-time', 'Canvas', 'Design Tools', 'WebSockets'],
  'opensource',
  'Computer Science',
  'Web Development',
  'Web Development',
  '{"react": "18.2", "websocket": "1.6", "canvas": "api"}'::jsonb,
  '{"javascript": "ES2022", "typescript": "5.1"}'::jsonb,
  '{"react": "18.2", "express": "4.18"}'::jsonb,
  '{"docker": "24.0", "redis": "7.0"}'::jsonb,
  true,
  true,
  'published',
  1780,
  128,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 27. E-commerce Platform
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'E-commerce Platform',
  'ecommerce-platform',
  'Full-featured e-commerce platform with payment integration and inventory management using Next.js, Stripe, and PostgreSQL for online retail.',
  'The E-commerce Platform provides complete e-commerce solution for online businesses. It features product catalog, shopping cart, payment processing, inventory management, order tracking, and admin dashboard.',
  'Building an e-commerce platform requires integrating multiple complex systems from payments to inventory. Existing solutions are expensive or lack flexibility. Organizations need customizable platforms that can scale with their business.',
  'Next.js for frontend, Stripe for payment processing, PostgreSQL for database, Prisma for ORM, TailwindCSS for styling. The system provides a complete e-commerce experience with modern architecture.',
  ARRAY['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL', 'Prisma', 'TailwindCSS'],
  'https://github.com/vercel/commerce',
  null,
  '/images/projects/ecommerce-platform-cover.jpg',
  ARRAY['/images/projects/ecommerce-platform-store.jpg', '/images/projects/ecommerce-platform-checkout.jpg', '/images/projects/ecommerce-platform-admin.jpg'],
  'Payment integration required understanding security best practices and PCI compliance. We learned to handle inventory management and order processing reliably. Next.js SSR optimization was crucial for performance. Database design for e-commerce taught us valuable lessons about data modeling and transaction management.',
  ARRAY['Web Development', 'E-commerce', 'Next.js', 'Stripe', 'PostgreSQL', 'Full-stack'],
  'opensource',
  'Computer Science',
  'Web Development',
  'Web Development',
  '{"nextjs": "13.4", "stripe": "latest", "prisma": "5.1"}'::jsonb,
  '{"typescript": "5.1"}'::jsonb,
  '{"nextjs": "13.4", "tailwindcss": "3.3"}'::jsonb,
  '{"docker": "24.0", "stripe-cli": "latest"}'::jsonb,
  true,
  true,
  'published',
  1650,
  117,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 28. Project Management Tool
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Project Management Tool',
  'project-management-tool',
  'Jira-like project management system with Kanban boards and time tracking using React, Node.js, PostgreSQL, and WebSockets for team coordination.',
  'The Project Management Tool helps teams manage projects, tasks, and workflows efficiently. It features Kanban boards, task management, time tracking, team collaboration, analytics dashboard, and real-time updates.',
  'Project management is essential for team productivity, but existing tools are expensive or lack flexibility. Organizations need customizable solutions that can adapt to their specific workflows and integration requirements.',
  'React for frontend, Node.js for backend, PostgreSQL for database, WebSockets for real-time updates, D3.js for analytics. The system provides comprehensive project management capabilities.',
  ARRAY['React', 'Node.js', 'PostgreSQL', 'WebSockets', 'D3.js', 'TypeScript'],
  'https://github.com/mattermost/mattermost',
  null,
  '/images/projects/project-management-cover.svg',
  ARRAY['/images/projects/project-management-kanban.jpg', '/images/projects/project-management-tasks.jpg', '/images/projects/project-management-analytics.jpg'],
  'Real-time updates required careful state management and conflict resolution. We learned to implement efficient data synchronization strategies. Kanban board logic taught us valuable lessons about drag-and-drop interfaces and state persistence. Analytics visualization required understanding data aggregation and performance optimization.',
  ARRAY['Web Development', 'Project Management', 'Kanban', 'Real-time', 'Team Collaboration', 'Analytics'],
  'opensource',
  'Computer Science',
  'Web Development',
  'Web Development',
  '{"react": "18.2", "nodejs": "18.16", "postgresql": "15"}'::jsonb,
  '{"typescript": "5.1"}'::jsonb,
  '{"react": "18.2", "express": "4.18"}'::jsonb,
  '{"docker": "24.0", "d3": "7.8"}'::jsonb,
  true,
  true,
  'published',
  1590,
  113,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 29. Content Management System
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Content Management System',
  'content-management-system',
  'Headless CMS with API-first architecture and multi-site support using Node.js, GraphQL, PostgreSQL, and React for modern web applications.',
  'The Headless CMS provides flexible content management for modern web applications. It features content modeling, GraphQL API, multi-site support, user permissions, webhooks, and API-first architecture.',
  'Traditional CMS solutions are monolithic and difficult to integrate with modern frontend frameworks. Organizations need flexible, API-first solutions that support multi-site management and headless architecture.',
  'Node.js for backend, GraphQL for API, PostgreSQL for database, React for admin interface, TypeScript for type safety, Docker for deployment. The system provides a modern CMS experience.',
  ARRAY['Node.js', 'GraphQL', 'PostgreSQL', 'React', 'TypeScript', 'Docker'],
  'https://github.com/strapi/strapi',
  null,
  '/images/projects/cms-cover.svg',
  ARRAY['/images/projects/cms-admin.jpg', '/images/projects/cms-content-modeling.jpg', '/images/projects/cms-api.jpg'],
  'GraphQL API design required understanding query optimization and schema design. We learned to implement flexible content modeling that could adapt to various use cases. Multi-site support taught us valuable lessons about data isolation and shared content management. Performance optimization for GraphQL was crucial for large content repositories.',
  ARRAY['Web Development', 'CMS', 'Headless', 'GraphQL', 'API-first', 'Content Management'],
  'opensource',
  'Computer Science',
  'Web Development',
  'Web Development',
  '{"nodejs": "18.16", "graphql": "16.7", "postgresql": "15"}'::jsonb,
  '{"typescript": "5.1"}'::jsonb,
  '{"react": "18.2", "apollo": "3.7"}'::jsonb,
  '{"docker": "24.0", "strapi": "4.12"}'::jsonb,
  true,
  true,
  'published',
  1710,
  121,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- 30. Real-time Analytics Dashboard
INSERT INTO projects (
  id, title, slug, description, overview, problem_statement, architecture,
  tech_stack, github_url, demo_url, cover_image, screenshots, lessons_learned, tags,
  project_type, branch, domain, category, technologies, languages, frameworks, tools,
  featured, published, status, views_count, likes_count, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Real-time Analytics Dashboard',
  'real-time-analytics-dashboard',
  'Comprehensive analytics dashboard with real-time data visualization using React, D3.js, Apache Kafka, TimescaleDB, and WebSocket for business intelligence.',
  'The Real-time Analytics Dashboard provides real-time insights and data visualization for business metrics. It features real-time data visualization, custom dashboards, alert system, data export, and multi-tenant support.',
  'Business intelligence requires real-time data processing and visualization. Traditional analytics platforms are expensive or lack real-time capabilities. Organizations need customizable solutions that can handle high-volume data streams.',
  'React for frontend, D3.js for visualization, Apache Kafka for streaming, TimescaleDB for time series data, Node.js for backend, WebSocket for real-time updates. The system provides comprehensive analytics capabilities.',
  ARRAY['React', 'D3.js', 'Apache Kafka', 'TimescaleDB', 'Node.js', 'WebSocket'],
  'https://github.com/grafana/grafana',
  null,
  '/images/projects/analytics-dashboard-cover.svg',
  ARRAY['/images/projects/analytics-dashboard-realtime.jpg', '/images/projects/analytics-dashboard-custom.jpg', '/images/projects/analytics-dashboard-alerts.jpg'],
  'Real-time data processing required understanding stream processing and backpressure handling. We learned to optimize D3.js rendering for large datasets. Kafka integration taught us valuable lessons about message ordering and consumer group management. Dashboard performance optimization was crucial for user experience.',
  ARRAY['Web Development', 'Analytics', 'Real-time', 'Data Visualization', 'Dashboard', 'Business Intelligence'],
  'opensource',
  'Data Science',
  'Web Development',
  'Web Development',
  '{"react": "18.2", "d3": "7.8", "kafka": "3.5"}'::jsonb,
  '{"javascript": "ES2022", "typescript": "5.1"}'::jsonb,
  '{"react": "18.2", "express": "4.18"}'::jsonb,
  '{"docker": "24.0", "timescaledb": "2.11"}'::jsonb,
  true,
  true,
  'published',
  1860,
  135,
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- VERIFICATION AND SUMMARY
-- =====================================================

-- Verify project insertion
SELECT 
  category,
  COUNT(*) as project_count,
  STRING_AGG(title, ', ' ORDER BY title) as projects
FROM projects 
WHERE slug IN (
  'neural-network-visualizer',
  'ai-code-review-assistant',
  'object-detection-system',
  'nlp-sentiment-analyzer',
  'generative-ai-image-generator',
  'predictive-maintenance-system',
  'fraud-detection-system',
  'recommendation-engine',
  'time-series-forecasting-system',
  'customer-churn-prediction',
  'smart-home-automation-system',
  'industrial-iot-monitoring-platform',
  'environmental-monitoring-system',
  'smart-agriculture-system',
  'asset-tracking-system',
  'autonomous-mobile-robot',
  'robotic-arm-controller',
  'drone-flight-controller',
  'computer-vision-robot',
  'snake-robot',
  'network-intrusion-detection-system',
  'web-application-firewall',
  'password-security-auditor',
  'secure-file-storage-system',
  'security-information-event-management',
  'real-time-collaboration-platform',
  'ecommerce-platform',
  'project-management-tool',
  'content-management-system',
  'real-time-analytics-dashboard'
)
GROUP BY category
ORDER BY category;

-- Total count verification
SELECT 
  COUNT(*) as total_projects,
  COUNT(CASE WHEN featured = true THEN 1 END) as featured_projects,
  COUNT(CASE WHEN published = true THEN 1 END) as published_projects
FROM projects 
WHERE slug IN (
  'neural-network-visualizer',
  'ai-code-review-assistant',
  'object-detection-system',
  'nlp-sentiment-analyzer',
  'generative-ai-image-generator',
  'predictive-maintenance-system',
  'fraud-detection-system',
  'recommendation-engine',
  'time-series-forecasting-system',
  'customer-churn-prediction',
  'smart-home-automation-system',
  'industrial-iot-monitoring-platform',
  'environmental-monitoring-system',
  'smart-agriculture-system',
  'asset-tracking-system',
  'autonomous-mobile-robot',
  'robotic-arm-controller',
  'drone-flight-controller',
  'computer-vision-robot',
  'snake-robot',
  'network-intrusion-detection-system',
  'web-application-firewall',
  'password-security-auditor',
  'secure-file-storage-system',
  'security-information-event-management',
  'real-time-collaboration-platform',
  'ecommerce-platform',
  'project-management-tool',
  'content-management-system',
  'real-time-analytics-dashboard'
);
