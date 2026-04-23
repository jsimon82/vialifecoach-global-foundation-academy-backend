import app from './app.es.js';
import 'dotenv/config';

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Support ticket reply endpoint: POST /api/v1/admin/support/tickets/:ticketId/reply-test`);
});
