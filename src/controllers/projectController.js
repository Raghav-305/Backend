const dataService = require('../services/dataService');

exports.getAllProjects = (req, res) => {
  const projects = dataService.getNormalizedProjects();
  res.status(200).json(projects);
};

exports.getProjectBySlug = (req, res) => {
  const project = dataService.getProjectBySlug(req.params.slug);
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(project);
};

exports.getPortfolio = (req, res) => {
  const portfolio = dataService.getPortfolio();
  res.status(200).json(portfolio);
};
