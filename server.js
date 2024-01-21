const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ShavasaTicketing', { useNewUrlParser: true, useUnifiedTopology: true });

// Support Agent Schema
const SupportAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  description: { type: String, required: true },
  active: { type: Boolean, default: true },
  dateCreated: { type: Date, default: Date.now }
});

const SupportAgent = mongoose.model('SupportAgent', SupportAgentSchema);

// Support Ticket Schema
const SupportTicketSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  description: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  severity: { type: String, required: true },
  type: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportAgent', default: null },
  status: { type: String, enum: ['New', 'Assigned', 'Resolved'] },
  resolvedOn: { type: Date, default: null }
});

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(bodyParser.json());

// Middleware to log warnings for all requests
app.use((req, res, next) => {
  console.warn(`Warning: ${req.method} request to ${req.path}`);
  next();
});

// Create Support Agent
app.post('/api/support-agents', async (req, res) => {
  try {
    const agent = new SupportAgent(req.body);
    await agent.save();
    res.status(201).send(agent);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Create Support Ticket
app.post('/api/support-tickets', async (req, res) => {
  try {
    const ticket = new SupportTicket(req.body);
    await ticket.save();
    res.status(201).send(ticket);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get All Tickets with Filter, Sort, and Pagination
app.get('/api/support-tickets', async (req, res) => {
  try {
    const { status, assignedTo, severity, type, sortBy, sortOrder, page, limit } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const sort = {};
    if (sortBy) sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      skip: (page - 1) * limit,
      limit: parseInt(limit),
      sort: sort,
    };

    const tickets = await SupportTicket.find(filter).populate('assignedTo').exec();
    res.status(200).send(tickets);
  } catch (error) {
    res.status(400).send(error);
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
