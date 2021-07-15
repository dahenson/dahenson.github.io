#include <dirent.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>

#define FAILURE 0;
#define SUCCESS 1;

typedef struct Page {
  char filename[512];
  char filepath[512];
} Page;

static struct site_index {
  int len;
  struct Page pages[64];
} site_index;

int error(const char *msg, const char *val) {
  printf("ERROR: %s [%s]\n", msg, val);
  return FAILURE;
}

static int insert_content(const char *filepath, FILE *outfile) {
  int c;

  FILE *content = fopen(filepath, "r");
  if (!content)
    return error("Opening content file", filepath);

  while ((c = fgetc(content)) != EOF) {
    fputc(c, outfile);
  }

  fclose(content);
  return SUCCESS;
}

static int wrap_content(const char *infilepath, const char *outfilepath) {
  FILE *outfile = fopen(outfilepath, "w");

  struct stat attr;
  char edited_time[22];

  stat(infilepath, &attr);
  strftime(edited_time, 22, "%x at %I:%M %p", localtime(&attr.st_mtime));

  if (!outfile)
    return error("Opening output file", outfilepath);

  fputs("<!DOCTYPE html>\n", outfile);
  fputs("<html lang=\"en\">\n", outfile);
  fputs("  <head>\n", outfile);
  fputs("    <meta charset=\"utf8\">\n", outfile);
  fputs("    <title>Brain of Dane</title>\n", outfile);
  fputs("    <meta name=\"description\" content=\"My Personal Blog\">\n",
        outfile);
  fputs("    <link rel=\"stylesheet\" type=\"text/css\" "
        "href=\"/static/css/main.css\">\n",
        outfile);
  fputs("    <meta>\n", outfile);
  fputs("  </head>\n", outfile);
  fputs("  <body>\n", outfile);
  fputs("    <header>\n", outfile);
  fputs("      <h3><a href=\"/\">Dane Henson</a></h3>\n", outfile);
  fputs("      <nav>\n", outfile);
  fputs("      <a href=\"/\">home</a>\n", outfile);
  fputs("      <a href=\"/now\">now</a>\n", outfile);
  fputs("      <a href=\"/library\">library</a>\n", outfile);
  fputs("      </nav>\n", outfile);
  fputs("    </header>\n", outfile);
  fputs("    <main>\n\n", outfile);
  if (!insert_content(infilepath, outfile)) {
    fclose(outfile);
    return error("Building Page", outfilepath);
  }
  fputs("\n    </main>\n", outfile);
  fprintf(outfile, "    <footer>edited on %s</footer>\n", edited_time);
  fputs("  </body>\n", outfile);
  fputs("</html>", outfile);

  fclose(outfile);

  return SUCCESS;
}

static int generate_sitemap(const char *path) {
  int i;
  char filename[512];
  char *outfilepath;
  FILE *outfile;

  outfilepath = strcpy(site_index.pages[site_index.len].filepath, path);
  strcpy(site_index.pages[site_index.len].filename, "sitemap.html");

  strcat(outfilepath, "/");
  strcat(outfilepath, "sitemap.html");

  if (!(outfile = fopen(outfilepath, "w")))
    return FAILURE;

  fputs("<ul>", outfile);

  for (i = 0; i < site_index.len; i++) {
    strcpy(filename, site_index.pages[i].filename);
    fprintf(outfile, "<li><a href=\"%s\">%s</a></li>\n", filename, filename);
  }

  fputs("</ul>", outfile);

  fclose(outfile);

  return SUCCESS;
}

static int index_children(const char *path) {
  DIR *dir;
  struct dirent *entry;
  struct stat fileinfo;
  char subdirpath[512];

  if (!(dir = opendir(path)))
    return error("Indexing Children", path);

  while ((entry = readdir(dir)) != NULL) {
    strcpy(subdirpath, path);
    strcat(subdirpath, "/");
    strcat(subdirpath, entry->d_name);

    stat(subdirpath, &fileinfo);

    if (S_ISREG(fileinfo.st_mode)) {
      strcpy(site_index.pages[site_index.len].filepath, path);
      strcpy(site_index.pages[site_index.len].filename, entry->d_name);

      site_index.len++;
    }
  }

  closedir(dir);

  return SUCCESS;
}

static int generate_index() {
  index_children("content");

  generate_sitemap("content");

  printf("Indexed %d pages.\n", site_index.len);

  return SUCCESS;
}

static int generate_site(const char *outpath) {
  int i;
  char infilepath[512];
  char outfilepath[512];

  for (i = 0; i < site_index.len; i++) {
    strcpy(infilepath, site_index.pages[i].filepath);
    strcat(infilepath, "/");
    strcat(infilepath, site_index.pages[i].filename);

    strcpy(outfilepath, outpath);
    strcat(outfilepath, "/");
    strcat(outfilepath, site_index.pages[i].filename);

    if (!wrap_content(infilepath, outfilepath))
      return error("Building Page", outfilepath);
  }

  return SUCCESS;
}

int main() {
  site_index.len = 0;

  if (!generate_index()) {
    printf("Failed to generate the index!\n");
    return 1;
  }
  if (!generate_site("..")) {
    printf("Failed to generate the site!\n");
    return 1;
  }

  return 0;
}
