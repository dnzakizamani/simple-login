"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Github, Mail, ExternalLink, Code, Palette, Zap, Sun, Moon, Sparkles, ChevronDown, Menu } from "lucide-react";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [randomPositions, setRandomPositions] = useState<{ x: number; y: number; duration: number }[]>([]);
  const [isDark, setIsDark] = useState(false);

  

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Generate random positions only on client side to avoid hydration mismatch
    const positions = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 3 + 2,
    }));
    setRandomPositions(positions);

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const projects = [
    {
      title: "E-Commerce Platform",
      description: "Full-stack e-commerce solution with React, Node.js, and PostgreSQL",
      tech: ["React", "Node.js", "PostgreSQL", "Stripe"],
      link: "#",
    },
    {
      title: "Task Management App",
      description: "Collaborative task management with real-time updates",
      tech: ["Next.js", "Socket.io", "MongoDB", "Tailwind"],
      link: "#",
    },
    {
      title: "Weather Dashboard",
      description: "Beautiful weather app with location-based forecasts",
      tech: ["React", "OpenWeather API", "Chart.js"],
      link: "#",
    },
  ];

  const skills = [
    { name: "React/Next.js", level: 95 },
    { name: "TypeScript", level: 90 },
    { name: "Node.js", level: 85 },
    { name: "Python", level: 80 },
    { name: "PostgreSQL", level: 85 },
    { name: "AWS", level: 75 },
  ];

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div
          className="absolute inset-0 bg-gradient-radial from-gray-500/20 via-transparent to-transparent"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0.05) 0%, transparent 50%)`,
          }}
        />
        {randomPositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-black rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 md:mx-0 mx-0">
        <div className="relative mx-4 mt-4 mb-2">
          {/* Border container with rounded corners */}
          <div className=" absolute inset-0 rounded-full pointer-events-none z-20 bg-gradient-to-r from-white/80 via-white/40 to-white/80 border border-gray-300 shadow-[0_0_20px_5px_rgba(200,200,200,0.25)] "></div> 
          <div className=" relative z-10 rounded-full backdrop-blur-2xl bg-white/70 supports-[backdrop-filter]:bg-white/50 border border-gray-200 dark:border-white/20 shadow-[0_8px_30px_rgba(255,255,255,0.2)] ">
            <div style={{ width: "57rem" }}>
              <div className="z-50 mx-auto max-w-7xl rounded-full transition-all duration-300 xl:px-0 px-7 shadow-none">
                <div className="flex h-[56px] items-center justify-between p-4">
                  <a className="flex items-center gap-3" href="/">
                    <img
                      alt="Logo"
                      width="40"
                      height="40"
                      decoding="async"
                      className="hidden dark:block"
                      srcSet="https://cdn.fahli.dev/cdn-cgi/image/width=48,quality=75,format=auto/logo/fahli-logo-light.webp 1x, https://cdn.fahli.dev/cdn-cgi/image/width=96,quality=75,format=auto/logo/fahli-logo-light.webp 2x"
                      src="https://cdn.fahli.dev/cdn-cgi/image/width=96,quality=75,format=auto/logo/fahli-logo-light.webp"
                    />
                    <img
                      alt="Logo"
                      width="40"
                      height="40"
                      decoding="async"
                      className="dark:hidden"
                      srcSet="https://cdn.fahli.dev/cdn-cgi/image/width=48,quality=75,format=auto/logo/fahli-logo-dark.webp 1x, https://cdn.fahli.dev/cdn-cgi/image/width=96,quality=75,format=auto/logo/fahli-logo-dark.webp 2x"
                      src="https://cdn.fahli.dev/cdn-cgi/image/width=96,quality=75,format=auto/logo/fahli-logo-dark.webp"
                    />
                  </a>

                  <div className="hidden w-full md:block">
                    <ul className="relative mx-auto flex h-11 w-fit items-center justify-center rounded-full px-2">
                      <li className="z-10 flex h-full cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-black/80 hover:text-black">
                        <a data-kind="path" data-target="/" href="/">Home</a>
                      </li>
                      <li className="z-10 flex h-full cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-black/80 hover:text-black">
                        <a data-kind="path" data-target="/about" href="#about">About</a>
                      </li>
                      <li className="z-10 flex h-full cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-black/80 hover:text-black">
                        <a data-kind="path" data-target="/resume" href="#skills">Experiences</a>
                      </li>
                      <li className="z-10 flex h-full cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-black/80 hover:text-black">
                        <a data-kind="path" data-target="/projects" href="#projects">Projects</a>
                      </li>
                      <li className="z-10 flex h-full cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-200 text-black/80 hover:text-black">
                        <a data-kind="path" data-target="/contact" href="#contact">Contact</a>
                      </li>
                      {/* <li className="relative z-10 flex h-full items-center justify-center px-1" data-more-trigger="true">
                        <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors text-black" aria-label="More sections" type="button">
                          More <ChevronDown className="h-4 w-4" />
                        </button>
                      </li>
                      <li className="border-border bg-black/10 absolute inset-0 my-1.5 rounded-full border" style={{ left: "418px", width: "86.3906px" }}></li> */}
                    </ul>
                  </div>

                  <div className="flex shrink-0 flex-row items-center gap-1 md:gap-3">
                    <div className="flex items-center space-x-6"></div>
                    <button className="border-border text-black/80 hover:bg-black/10 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors">
                      <Sparkles className="h-4 w-4" />
                      <span>Ask AI</span>
                      <kbd className="bg-black/10 text-black/80 ml-2 hidden rounded px-1.5 text-[10px] font-medium md:inline-block">⌘K</kbd>
                    </button>
                    <button
                      onClick={() => setIsDark(!isDark)}
                      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-black/10 hover:text-black h-10 w-10 cursor-pointer rounded-full"
                    >
                      <Sun className="text-black h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                      <Moon className="text-black absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                      <span className="sr-only">Toggle theme</span>
                    </button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-black/10 hover:text-black h-10 w-10 cursor-pointer rounded-full md:hidden">
                      <Menu className="size-6" />
                      <span className="sr-only">Toggle Menu</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[76px]"></div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Full Stack Developer
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Crafting digital experiences with modern technologies and creative solutions
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a
              href="#projects"
              className="px-6 sm:px-8 py-3 bg-black text-white hover:bg-gray-800 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Code className="w-4 h-4 sm:w-5 sm:h-5" />
              View My Work
            </a>
            <a
              href="#contact"
              className="px-6 sm:px-8 py-3 border border-black hover:bg-black hover:text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              Get In Touch
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-black rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-black rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">About Me</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Passionate developer with 5+ years of experience building web applications.
              I love creating beautiful, functional, and user-friendly digital experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Code className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: "Clean Code",
                description: "Writing maintainable, scalable, and well-documented code"
              },
              {
                icon: <Palette className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: "UI/UX Design",
                description: "Creating intuitive and visually appealing user interfaces"
              },
              {
                icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: "Performance",
                description: "Optimizing applications for speed and efficiency"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center hover:bg-gray-100 transition-colors"
              >
                <div className="text-black mb-3 sm:mb-4 flex justify-center">{item.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm sm:text-base">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Featured Projects</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Here are some of the projects I've worked on recently
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all hover:scale-105"
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs sm:text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  className="text-black hover:text-gray-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  View Project <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Skills & Technologies</h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Technologies I work with on a daily basis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl p-4 sm:p-6"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm sm:text-base">{skill.name}</span>
                  <span className="text-gray-600 text-sm">{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-black h-2 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Let's Work Together</h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              I'm always interested in new opportunities and exciting projects.
              Let's discuss how we can bring your ideas to life!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:fahli@example.com"
                className="px-6 sm:px-8 py-3 bg-black text-white hover:bg-gray-800 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                Send Email
              </a>
              <a
                href="https://github.com/fahli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 sm:px-8 py-3 border border-black hover:bg-black hover:text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                View GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            © 2024 Fahli.dev. Built with Next.js, TypeScript, and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
