import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Variabili d'ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware globali 
// Security headers
app.use(helmet());

// CORS configurato per il frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}
));

// Logging delle richieste
app.use(morgan('combined'));

// Parser JSON con limite
app.use(express.json({ limit: '10mb' }));

// Parser URL-encoded
app.use(express.urlencoded({ extended: true }));

// Route di test
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Portfolio Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Avvio server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
