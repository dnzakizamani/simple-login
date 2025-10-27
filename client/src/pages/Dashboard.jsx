import React from 'react'
import Layout from '../components/Layout'
import * as FaIcons from 'react-icons/fa'
import * as SiIcons from 'react-icons/si'

export default function Dashboard() {
  return (
    <Layout title="Portfolio">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/3 mb-6 md:mb-0">
            <img
              src="/avatar-placeholder.png"
              alt="Profile"
              className="w-48 h-48 rounded-full mx-auto border-4 border-white shadow-lg"
            />
          </div>
          <div className="md:w-2/3 md:pl-8">
            <h1 className="text-4xl font-bold mb-4">Hi, I'm Zaki</h1>
            <p className="text-xl mb-4">Full Stack Developer & Software Engineer</p>
            <p className="text-lg leading-relaxed">
              Passionate about creating innovative solutions and building scalable web applications.
              With expertise in modern technologies, I love turning ideas into reality through code.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'React', icon: SiIcons.SiReact, color: 'text-blue-500' },
            { name: 'Node.js', icon: SiIcons.SiNodedotjs, color: 'text-green-500' },
            { name: 'Python', icon: SiIcons.SiPython, color: 'text-yellow-500' },
            { name: 'JavaScript', icon: SiIcons.SiJavascript, color: 'text-yellow-400' },
            { name: 'TypeScript', icon: SiIcons.SiTypescript, color: 'text-blue-600' },
            { name: 'MongoDB', icon: SiIcons.SiMongodb, color: 'text-green-600' },
            { name: 'PostgreSQL', icon: SiIcons.SiPostgresql, color: 'text-blue-700' },
            { name: 'Docker', icon: SiIcons.SiDocker, color: 'text-blue-400' },
            { name: 'AWS', icon: SiIcons.SiAmazon, color: 'text-orange-500' },
            { name: 'Git', icon: SiIcons.SiGit, color: 'text-red-500' },
            { name: 'Tailwind CSS', icon: SiIcons.SiTailwindcss, color: 'text-teal-500' },
            { name: 'Express.js', icon: SiIcons.SiExpress, color: 'text-gray-600' },
          ].map((tech, i) => (
            <div key={i} className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
              <tech.icon className={`text-3xl mb-2 ${tech.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'E-Commerce Platform',
              description: 'A full-stack e-commerce solution with React, Node.js, and MongoDB. Features include user authentication, payment integration, and admin dashboard.',
              tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
              github: '#',
              demo: '#'
            },
            {
              title: 'Task Management App',
              description: 'A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.',
              tech: ['React', 'Express.js', 'Socket.io', 'PostgreSQL'],
              github: '#',
              demo: '#'
            },
            {
              title: 'Weather Dashboard',
              description: 'A responsive weather dashboard that displays current weather and forecasts using multiple APIs with beautiful data visualizations.',
              tech: ['Vue.js', 'Chart.js', 'OpenWeather API'],
              github: '#',
              demo: '#'
            },
          ].map((project, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">{project.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((t, j) => (
                  <span key={j} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex space-x-4">
                <a href={project.github} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <FaIcons.FaGithub className="mr-2" />
                  Code
                </a>
                <a href={project.demo} className="flex items-center text-blue-600 hover:text-blue-800">
                  <FaIcons.FaExternalLinkAlt className="mr-2" />
                  Demo
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resume Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Resume</h2>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Download my resume to learn more about my experience and skills.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Last updated: January 2024</p>
          </div>
          <a
            href="/resume.pdf"
            download
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaIcons.FaDownload className="mr-2" />
            Download Resume
          </a>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Get In Touch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FaIcons.FaEnvelope,
              label: 'Email',
              value: 'zaki@example.com',
              link: 'mailto:zaki@example.com'
            },
            {
              icon: FaIcons.FaPhone,
              label: 'Phone',
              value: '+62 812-3456-7890',
              link: 'tel:+6281234567890'
            },
            {
              icon: FaIcons.FaLinkedin,
              label: 'LinkedIn',
              value: 'linkedin.com/in/zaki',
              link: 'https://linkedin.com/in/zaki'
            },
            {
              icon: FaIcons.FaGithub,
              label: 'GitHub',
              value: 'github.com/zaki',
              link: 'https://github.com/zaki'
            },
          ].map((contact, i) => (
            <a
              key={i}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <contact.icon className="text-3xl mb-3 text-blue-600" />
              <span className="font-medium text-gray-800 dark:text-gray-200 mb-1">{contact.label}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 text-center">{contact.value}</span>
            </a>
          ))}
        </div>
      </section>
    </Layout>
  )
}
