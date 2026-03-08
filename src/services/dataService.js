const path = require('path');
const fs = require('fs-extra');
const { slugify } = require('../utils/stringUtils');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
fs.ensureDirSync(DATA_DIR);

function readJSON(name, fallback = []) {
  const p = path.join(DATA_DIR, name);
  try {
    if (!fs.existsSync(p)) return fallback;
    return fs.readJsonSync(p);
  } catch (e) {
    return fallback;
  }
}

function writeJSON(name, data) {
  const p = path.join(DATA_DIR, name);
  fs.writeJsonSync(p, data, { spaces: 2 });
}

function normalizeProject(raw, index, clientsById) {
  const id = raw?.id ?? `project-${index + 1}`;
  const title = typeof raw?.title === 'string' && raw.title.trim()
    ? raw.title.trim()
    : `Project ${index + 1}`;
  const slug = typeof raw?.slug === 'string' && raw.slug.trim()
    ? raw.slug.trim()
    : slugify(title) || `project-${index + 1}`;
  const categories = Array.isArray(raw?.categories)
    ? raw.categories.filter((item) => typeof item === 'string' && item.trim())
    : typeof raw?.category === 'string' && raw.category.trim()
      ? [raw.category.trim()]
      : ['Experiential'];
  const clientId = typeof raw?.clientId === 'string' && raw.clientId.trim()
    ? raw.clientId.trim()
    : null;
  const client = typeof raw?.client === 'string' && raw.client.trim()
    ? raw.client.trim()
    : clientId && clientsById.has(clientId)
      ? clientsById.get(clientId)
      : 'Client';
  const parsed = raw?.date ? new Date(raw.date) : null;
  const date = parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
  const location = typeof raw?.location === 'string' ? raw.location : '';
  const stats = Array.isArray(raw?.stats)
    ? raw.stats
        .filter(
          (item) =>
            item &&
            typeof item.label === 'string' &&
            item.label.trim() &&
            item.value !== undefined &&
            item.value !== null
        )
        .map((item) => ({
          label: String(item.label).trim(),
          value: String(item.value),
        }))
    : [];

  return {
    ...raw,
    id,
    title,
    slug,
    categories,
    clientId,
    client,
    date,
    location,
    stats,
  };
}

function normalizeClient(raw, index) {
  return {
    ...raw,
    id: raw?.id || `client-${index + 1}`,
    name:
      typeof raw?.name === 'string' && raw.name.trim()
        ? raw.name.trim()
        : `Client ${index + 1}`,
  };
}

function normalizeService(raw, index) {
  return {
    ...raw,
    id: raw?.id || `service-${index + 1}`,
    title:
      typeof raw?.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : `Service ${index + 1}`,
    summary:
      typeof raw?.summary === 'string' && raw.summary.trim()
        ? raw.summary.trim()
        : '',
  };
}

function getNormalizedProjects() {
  const projectItems = readJSON('projects.json', []);
  const clientItems = readJSON('clients.json', []);
  const clientsById = new Map(
    clientItems.map((client) => [client.id, client.name]).filter((entry) => entry[0] && entry[1])
  );
  return projectItems.map((item, index) => normalizeProject(item, index, clientsById));
}

function getProjectBySlug(slug) {
  const normalized = getNormalizedProjects();
  return normalized.find((p) => p.slug === slug) || null;
}

function getClients() {
  const items = readJSON('clients.json', []);
  return items.map((item, index) => normalizeClient(item, index));
}

function getServices() {
  const items = readJSON('services.json', []);
  return items.map((item, index) => normalizeService(item, index));
}

function getPortfolio() {
  return {
    projects: getNormalizedProjects(),
    services: getServices(),
  };
}

module.exports = {
  readJSON,
  writeJSON,
  getNormalizedProjects,
  getProjectBySlug,
  getClients,
  getServices,
  getPortfolio,
};
