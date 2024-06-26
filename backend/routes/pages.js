const express = require('express');
const router = express.Router();
const { session } = require('../db/neo4j');

// Route to create a new page
router.post('/pages', async (req, res) => {
  const { name, websiteId } = req.body;
  const id = `page_${Date.now()}`;

  try {
    const result = await session.run(
      'CREATE (p:Page {id: $id, name: $name, websiteId: $websiteId}) RETURN p',
      { id, name, websiteId }
    );
    const page = result.records[0].get('p').properties;
    res.status(201).json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get all pages for a specific website
router.get('/website/:websiteId/pages', async (req, res) => {
  const { websiteId } = req.params;

  try {
    const result = await session.run('MATCH (p:Page {websiteId: $websiteId}) RETURN p', { websiteId });
    const pages = result.records.map(record => record.get('p').properties);
    res.status(200).json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to delete a page by its ID
router.delete('/pages/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await session.run('MATCH (p:Page {id: $id}) DETACH DELETE p', { id });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get websiteId by pageId
router.get('/page/:pageId/website', async (req, res) => {
  const { pageId } = req.params;

  try {
    const result = await session.run(
      'MATCH (p:Page {id: $pageId})-[:BELONGS_TO]->(w:Website) RETURN w.id AS websiteId',
      { pageId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Website not found for this page' });
    }

    const websiteId = result.records[0].get('websiteId');
    res.status(200).json({ websiteId });
  } catch (error) {
    console.error('Error fetching website ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get all pages and their widgets for a specific website
router.get('/website/:websiteId/full', async (req, res) => {
  const { websiteId } = req.params;

  try {
    const result = await session.run(`
      MATCH (w:Website {id: $websiteId})-[:HAS_PAGE]->(p:Page)
      OPTIONAL MATCH (p)-[:HAS_WIDGET]->(widget:Widget)
      RETURN p, collect(widget) AS widgets
    `, { websiteId });

    const pages = result.records.map(record => {
      const page = record.get('p').properties;
      const widgets = record.get('widgets').map(widgetRecord => {
        const widget = widgetRecord.properties;
        widget.data = JSON.parse(widget.data);
        widget.position = JSON.parse(widget.position);
        widget.size = JSON.parse(widget.size);
        return widget;
      });
      return { ...page, widgets };
    });

    res.status(200).json(pages);
  } catch (error) {
    console.error('Error fetching full website data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;