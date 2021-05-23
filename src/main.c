#include<stdio.h>
#include<unistd.h>
#include<dirent.h>
#include<string.h>
#include<sys/stat.h>
#include<time.h>

#define FAILURE 0;
#define SUCCESS 1;

typedef struct indexent
{
  char filename[512];
  char filepath[512];
} indexent;

typedef struct Siteindex
{
  int len;
  char srcpath[512];
  struct indexent entries[512];
} Siteindex;

int error(const char *msg, const char *val)
{
  printf("ERROR: %s [%s]\n", msg, val);
  return FAILURE;
}

int insert_content(const char *filepath, FILE *outfile)
{
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

int wrap_content(const char *infilepath, const char *outfilepath)
{
  FILE* outfile = fopen(outfilepath, "w");

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
  fputs("    <meta name=\"description\" content=\"My Personal Blog\">\n", outfile);
  fputs("    <link rel=\"stylesheet\" type=\"text/css\" href=\"/static/css/main.css\">\n", outfile);
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

char *rtrim(char *str, const char *seps)
{
  int i;
  i = strlen(str) - 1;

  while (i >= 0 && strchr(seps, str[i]) != NULL) {
    str[i] = '\0';
    i--;
  }

  return str;
}

int generate_sitemap(Siteindex *i, const char *path)
{
  int j;
  char filename[512];
  char *outfilepath;
  FILE* outfile;

  outfilepath = strcpy(i->entries[i->len].filepath, path);
  strcpy(i->entries[i->len].filename, "sitemap.html");

  strcat(outfilepath, "sitemap.html");

  if (!(outfile = fopen(outfilepath, "w")))
    return FAILURE;

  for (j = 0; j < i->len; j++) {
    strcpy(filename, i->entries[j].filename);
    rtrim(filename, ".html");
    fprintf(outfile, "<a href=\"%s\">%s</a><br />\n", filename, filename);
  }

  fclose(outfile);

  return SUCCESS;
}

int index_children(Siteindex *i, const char *path)
{
  DIR *dir;
  struct dirent *entry;
  char subdirpath[512];

  if (!(dir = opendir(path)))
    return error("Indexing Children", path);

  while ((entry = readdir(dir)) != NULL) {
    switch (entry->d_type) {
      case (DT_REG):
        strcpy(i->entries[i->len].filepath, path);
        strcpy(i->entries[i->len].filename, entry->d_name);

        i->len++;
        break;

      case (DT_DIR):
        if (strcmp(entry->d_name, "..") <= 0)
          continue;
        strcpy(subdirpath, path);
        strcat(subdirpath, "/");
        strcat(subdirpath, entry->d_name);

        printf("Indexing Subdirectory: %s\n", subdirpath);
        index_children(i, subdirpath);
        break;

      default:
        printf("Skipping: %s\n", entry->d_name);
        break;
    }
  }

  closedir(dir);

  return SUCCESS;
}

int generate_index(Siteindex *i, const char *path)
{
  char pwd[512];

  getcwd(pwd, 512);

  chdir(path);
  index_children(i, ".");

  chdir(pwd);
  generate_sitemap(i, path);

  printf("Indexed %d pages.\n", i->len);

  return SUCCESS;
}

int generate_site(Siteindex *i, const char *outpath)
{
  int j;
  char infilepath[512];
  char outfilepath[512];

  for (j = 0; j < i->len; j++) {
    strcpy(infilepath, i->srcpath);
    strcat(infilepath, "/");
    strcat(infilepath, i->entries[j].filepath);
    strcat(infilepath, "/");
    strcat(infilepath, i->entries[j].filename);

    strcpy(outfilepath, outpath);
    strcat(outfilepath, "/");
    strcat(outfilepath, i->entries[j].filepath);
    mkdir(outfilepath, S_IRWXU);

    strcat(outfilepath, "/");
    strcat(outfilepath, i->entries[j].filename);

    if (!wrap_content(infilepath, outfilepath))
      return error("Building Page", outfilepath);
  }

  return SUCCESS;
}

int main()
{
  Siteindex site_index;
  char *inputpath = "content";
  char *outputpath = "..";

  site_index.len = 0;
  strcpy(site_index.srcpath, inputpath);

  if (!generate_index(&site_index, inputpath)) {
    printf("Failed to generate the index!\n");
    return 1;
  }
  if (!generate_site(&site_index, outputpath)) {
    printf("Failed to generate the site!\n");
    return 1;
  }
}

