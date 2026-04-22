export interface ShopifyArticle {
  handle: string
  title: string
  author: {
    name: string
  }
  tags: string[]
  image?: {
    url: string
  }
  isPublished: boolean
  publishedAt: string
  body: string
  blogName?: string
  blogHandle?: string
  blog?: {
    handle: string
    title: string
  }
}

interface BlogEdge {
  node: {
    handle: string
    title: string
    articles: {
      edges: Array<{
        node: ShopifyArticle
      }>
    }
  }
}

const SHOPIFY_GRAPHQL_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN

// Blog handle filters for different sections
const THEME_HANDLES = ["theme"] // Theme blogs
const APP_HANDLES = ["app"] // App blogs

const BLOGS_QUERY = `
  query GetAllBlogs($first: Int = 20, $after: String) {
    blogs(first: $first, after: $after) {
      edges {
        node {
          handle
          title
          articles(first: 50) {
            edges {
              node {
                handle
                title
                tags
                image {
                  url
                }
                isPublished
                publishedAt
                body
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const ARTICLE_BY_HANDLE_QUERY = `
  query GetArticleByHandle($handle: String!) {
    articles(first: 1, query: $handle) {
      edges {
        node {
          handle
          title
          tags
          image {
            url
          }
          publishedAt
          body
          blog {
            title
            handle
          }
        }
      }
    }
  }
`

export async function getShopifyArticles(section: "theme" | "app" = "theme") {
  if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN) {
    console.warn("Shopify credentials missing. Falling back to empty array.")
    return []
  }

  const allowedHandles = section === "theme" ? THEME_HANDLES : APP_HANDLES

  try {
    const response = await fetch(SHOPIFY_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        query: BLOGS_QUERY,
        variables: { first: 50 },
      }),
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("Shopify API text response:", text)
      throw new Error(`Shopify API error: ${response.statusText}`)
    }

    const json = await response.json()

    if (json.errors) {
      console.error("Shopify GraphQL Errors:", json.errors)
      return []
    }

    if (!json.data?.blogs) {
      console.error("No blogs found in Shopify response")
      return []
    }

    const allArticles: ShopifyArticle[] = []

    json.data.blogs.edges.forEach((blogEdge: BlogEdge) => {
      const blog = blogEdge.node
      // Filter by blog handle based on section
      if (!allowedHandles.includes(blog.handle)) return

      blog.articles.edges.forEach((articleEdge: { node: ShopifyArticle }) => {
        const article = articleEdge.node
        allArticles.push({
          ...article,
          blogName: blog.title,
          blogHandle: blog.handle,
        })
      })
    })

    // Sort by date (latest first)
    return allArticles
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .filter((a) => a.isPublished)
  } catch (error) {
    console.error("Error fetching Shopify articles:", error)
    return []
  }
}

export async function getShopifyArticleBySlug(
  slug: string,
  section: "theme" | "app" = "theme"
) {
  if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN) {
    console.warn("Shopify credentials missing.")
    return null
  }

  // Select blog handles based on section
  const allowedHandles = section === "theme" ? THEME_HANDLES : APP_HANDLES

  try {
    const response = await fetch(SHOPIFY_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        query: ARTICLE_BY_HANDLE_QUERY,
        variables: { handle: `handle:${slug}` },
      }),
      next: { revalidate: 3600 },
    })

    const json = await response.json()

    if (json.errors) {
      console.error(
        "Shopify GraphQL Errors when fetching article:",
        json.errors
      )
      return null
    }

    if (!json.data?.articles?.edges?.length) {
      return null
    }

    const node = json.data.articles.edges[0].node

    // Filter by blog handle based on section
    if (!allowedHandles.includes(node.blog.handle)) {
      return null
    }

    return {
      ...node,
      blogName: node.blog.title,
      blogHandle: node.blog.handle,
    } as ShopifyArticle
  } catch (error) {
    console.error("Error fetching shopify article by handle:", error)
    return null
  }
}
