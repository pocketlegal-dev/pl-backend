const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pocket Legal API',
      version: '1.0.0',
      description: 'API documentation for Pocket Legal platform',
      contact: {
        name: 'API Support',
        email: 'support@pocketlegal.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Path to the API docs
  apis: [
    './src/modules/*/routes/*.js',
    './src/modules/*/models/*.js',
    './src/modules/*/controllers/*.js',
    './src/modules/*/schemas/*.js'
  ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Pocket Legal API Documentation'
  })
}; 